import type { Asset, Finding, Issue, Permission, Project, ProjectAsset, Rec, Status } from './types'

const list = (a: string[]) => (a.length ? a.join(', ') : 'none recorded')
const fmt = (s: number) => `${Math.floor(s / 60)}:${String(Math.round(s % 60)).padStart(2, '0')}`
export const segment = (pa: ProjectAsset) => `${fmt(pa.start)}–${fmt(pa.start + pa.len)} (${pa.context})`

/** Rule-based comparison of recorded permission vs intended usage. No AI, no legal reasoning. */
export function checkAsset(p: Project, pa: ProjectAsset, perm: Permission | undefined): Issue[] {
  if (!perm || perm.verification !== 'verified') {
    const state = !perm ? 'No permission record exists' : perm.verification === 'pending' ? 'The permission record is awaiting verification' : perm.verification === 'rejected' ? 'The submitted permission information was rejected' : 'The permission record is not verified'
    return [{
      type: 'unverified', status: 'unverified', title: 'Insufficient permission information',
      explanation: `${state}${perm && !perm.docs ? ' and no license document is attached' : ''}. Insufficient permission information. Human verification required.`,
      why: 'Without verified terms we cannot tell whether this usage is allowed, so it is neither approved nor blocked.',
      evidence: perm ? `${perm.id} › verification: ${perm.verification}; document: ${perm.docs ?? 'missing'}` : 'No permission record',
      severity: 'Medium', next: 'Request human review, upload documentation, or replace the asset.',
    }]
  }
  const ev = (field: string, v: string) => `${perm.id} › ${field}: ${v}${perm.docs ? ` (${perm.docs})` : ''}`
  const out: Issue[] = []
  if (perm.expiration && perm.expiration < p.end)
    out.push({
      type: 'expired', value: perm.expiration, status: 'conflict',
      title: perm.expiration < p.start ? 'License expired before the project starts' : 'License expires before the project ends',
      explanation: `The recorded license is valid until ${perm.expiration}; the project runs ${p.start} to ${p.end}.`,
      why: 'Using an asset after its license ends can expose the client to claims.',
      evidence: ev('expiration_date', perm.expiration), severity: 'High', next: 'Renew the license, replace the asset, or shorten the project dates.',
    })
  for (const u of p.usages)
    if (!perm.permittedUses.includes(u))
      out.push({
        type: 'usage', value: u, status: 'conflict', title: `${u} is not covered`,
        explanation: `Recorded permitted uses are: ${list(perm.permittedUses)}. The project intends: ${u}.${perm.restrictedUses.includes(u) ? ' This use is explicitly restricted.' : ''}`,
        why: 'The license does not include this kind of use, so publishing as planned would exceed it.',
        evidence: ev('permitted_uses', list(perm.permittedUses)), severity: 'High', next: 'Replace the asset, request extra permission, or change the intended usage.',
      })
  for (const c of p.channels)
    if (!perm.permittedChannels.includes(c) && !perm.permittedChannels.includes('Any'))
      out.push({
        type: 'channel', value: c, status: 'conflict', title: `${c} is not an allowed channel`,
        explanation: `Recorded channels: ${list(perm.permittedChannels)}. The project distributes on ${c}.`,
        why: 'Licenses often limit where content may appear.',
        evidence: ev('permitted_channels', list(perm.permittedChannels)), severity: 'High', next: 'Replace the asset, request permission for this channel, or drop the channel.',
      })
  if (!perm.permittedRegions.includes('Worldwide') && !perm.permittedRegions.includes(p.region))
    out.push({
      type: 'region', value: p.region, status: 'conflict', title: `${p.region} is outside the licensed region`,
      explanation: `Recorded regions: ${list(perm.permittedRegions)}. The project targets ${p.region}.`,
      why: 'Territory limits apply wherever the content can be viewed or aired.',
      evidence: ev('permitted_regions', list(perm.permittedRegions)), severity: 'High', next: 'Narrow the target region, replace the asset, or request wider territory.',
    })
  if (p.commercial && perm.commercial === false)
    out.push({
      type: 'commercial', status: 'conflict', title: 'Commercial use is not permitted',
      explanation: 'The record says commercial use is not allowed, but this project is commercial.',
      why: 'Non-commercial licenses cannot be used to promote or sell.',
      evidence: ev('commercial_use', 'not permitted'), severity: 'High', next: 'Replace the asset or request a commercial license.',
    })
  if (out.length) return out
  if (perm.attribution && !pa.attributionAdded)
    out.push({
      type: 'attribution', status: 'conditional', title: 'Attribution required',
      explanation: `The license requires: "${perm.attribution}". It has not been added to this project.`,
      why: 'Missing credit breaches the license even when everything else matches.',
      evidence: ev('attribution_requirements', perm.attribution), severity: 'Low', next: 'Add the credit line and confirm.',
    })
  if (perm.approvalRequired && !pa.approvalObtained)
    out.push({
      type: 'approval', status: 'conditional', title: 'Rights-holder approval required',
      explanation: `${perm.rightsHolder} must approve this use before publishing.`,
      why: 'The license is conditional on written approval.',
      evidence: ev('restrictions', perm.restrictions || 'approval required'), severity: 'Medium', next: 'Request approval from the rights holder.',
    })
  return out
}

export const statusOf = (issues: Issue[]): Status =>
  issues.some(i => i.status === 'unverified') ? 'unverified'
  : issues.some(i => i.status === 'conflict') ? 'conflict'
  : issues.some(i => i.status === 'conditional') ? 'conditional' : 'verified'

export interface Ctx { assets: Asset[]; permissions: Permission[] }
const permOf = (c: Ctx, a: Asset) => c.permissions.find(x => x.id === a.permissionId)

export function checkProject(p: Project, c: Ctx) {
  const rows = p.assets.map(pa => {
    const asset = c.assets.find(a => a.id === pa.assetId)!
    const issues = checkAsset(p, pa, permOf(c, asset))
    const findings: Finding[] = issues.map(i => ({ ...i, id: `${p.id}:${pa.id}:${i.type}:${i.value ?? ''}`, projectId: p.id, assetId: asset.id, paId: pa.id }))
    return { pa, asset, status: statusOf(issues), findings }
  })
  const count = (s: Status) => rows.filter(r => r.status === s).length
  const overall: Status | 'empty' = !rows.length ? 'empty' : count('conflict') ? 'conflict' : count('unverified') ? 'unverified' : count('conditional') ? 'conditional' : 'verified'
  return { rows, overall, counts: { verified: count('verified'), conditional: count('conditional'), conflict: count('conflict'), unverified: count('unverified') }, findings: rows.flatMap(r => r.findings) }
}

/** Library-level status, independent of any project (today-based expiry, limited scope = conditional). */
export function libraryStatus(perm: Permission | undefined, today = new Date().toISOString().slice(0, 10)): Status {
  if (!perm || perm.verification !== 'verified') return 'unverified'
  if (perm.expiration && perm.expiration < today) return 'conflict'
  const limited = perm.permittedUses.length < 6 || perm.permittedChannels.length < 7 || !perm.permittedRegions.includes('Worldwide') || perm.commercial === false
  return limited || perm.attribution || perm.approvalRequired ? 'conditional' : 'verified'
}

function replacement(p: Project, asset: Asset, c: Ctx): Asset | null {
  const inProject = new Set(p.assets.map(a => a.assetId))
  return c.assets.find(a => a.type === asset.type && !inProject.has(a.id)
    && checkAsset(p, { id: 'x', assetId: a.id, track: 'Video', start: 0, len: 1, context: '' }, permOf(c, a)).length === 0) ?? null
}

export function recommend(f: Finding, p: Project, c: Ctx): Rec[] {
  const pa = p.assets.find(x => x.id === f.paId)!
  const asset = c.assets.find(a => a.id === f.assetId)!
  const perm = permOf(c, asset)
  const seg = segment(pa)
  const mk = (action: Rec['action'], r: Omit<Rec, 'id' | 'findingId' | 'assetId' | 'action' | 'segment' | 'reason'>): Rec =>
    ({ id: `${f.id}:${action}`, findingId: f.id, assetId: asset.id, action, segment: seg, reason: f.explanation, ...r })
  const rep = replacement(p, asset, c)
  const replace = mk('replace', {
    title: 'Replace the asset', proposed: rep ? `Swap "${asset.name}" for "${rep.name}", which matches this project's recorded usage.` : `No verified ${asset.type.toLowerCase()} in the library fits this project. Replace "${asset.name}" with a newly licensed one.`,
    creative: `The ${asset.type.toLowerCase()} in ${seg} changes; the creative feel may differ.`, permission: 'The conflicting asset leaves this usage. The replacement is re-checked automatically.',
    effort: 'Low', followUp: rep ? 'Review the new asset in context.' : 'Upload the new asset and its license, then re-run the check.', effect: { k: 'replace', withId: rep?.id ?? null },
  })
  const remove = mk('remove', {
    title: 'Remove from the timeline', proposed: `Remove "${asset.name}" from ${seg}.`, creative: 'The scene loses this element; edit around the gap.',
    permission: 'No longer relevant to this project once removed.', effort: 'Low', followUp: 'Check the cut still works without it.', effect: { k: 'remove' },
  })
  const ask = (grant: NonNullable<Extract<Rec['effect'], { k: 'review' }>['grant']>, what: string) => mk('request_permission', {
    title: 'Request additional permission', proposed: `Contact ${perm?.rightsHolder ?? 'the rights holder'} to ${what}.`,
    creative: 'No creative change if permission is granted.', permission: 'Stays a conflict until a reviewer records the permission. Awaiting approval.',
    effort: 'Medium', followUp: 'Upload the written permission and have a reviewer verify it.', effect: { k: 'review', section: 'approval', grant },
  })
  switch (f.type) {
    case 'usage': {
      const left = p.usages.filter(u => u !== f.value)
      const patch = { usages: left.length ? left : perm?.permittedUses.slice(0, 1) ?? [] }
      const changeUse = patch.usages.length ? [mk('change_usage', {
        title: 'Change distribution purpose', proposed: `Change the project usage to: ${patch.usages.join(', ') || 'none'}.`,
        creative: 'Creative stays the same; campaign plans change.', permission: 'Affects every asset: all other restrictions are re-checked, and the project is not assumed suitable.',
        effort: 'Low', followUp: 'Confirm with the client that the new purpose is acceptable.', effect: { k: 'project', patch },
      })] : []
      return [replace, ask({ kind: 'use', value: f.value }, `allow ${(f.value ?? 'this use').toLowerCase()}`), ...changeUse, remove]
    }
    case 'channel': {
      const patch = { channels: p.channels.filter(x => x !== f.value) }
      const drop = patch.channels.length ? [mk('change_usage', {
        title: `Drop ${f.value} from distribution`, proposed: `Remove ${f.value} from the project's channels.`,
        creative: 'Content unchanged; reach narrows.', permission: 'All other assets are re-checked against the new channel list.', effort: 'Low', followUp: 'Tell the media team.', effect: { k: 'project', patch },
      })] : []
      return [replace, ask({ kind: 'channel', value: f.value }, `allow use on ${f.value}`), ...drop, remove]
    }
    case 'region': {
      const to = perm?.permittedRegions[0]
      const narrow = to ? [mk('change_usage', {
        title: 'Narrow the target region', proposed: `Change the target region to ${to}.`, creative: 'Content unchanged; market narrows.',
        permission: 'All other assets are re-checked for the new region.', effort: 'Low', followUp: 'Confirm the narrower market with the client.', effect: { k: 'project', patch: { region: to } },
      })] : []
      return [replace, ask({ kind: 'region', value: p.region }, `extend the license to ${p.region}`), ...narrow, remove]
    }
    case 'commercial': return [replace, ask({ kind: 'commercial' }, 'upgrade to a commercial license'), remove]
    case 'expired': {
      const opts = [replace, ask({ kind: 'expiry', value: p.end }, `renew the license through ${p.end}`)]
      if (perm?.expiration && perm.expiration >= p.start)
        opts.push(mk('change_usage', {
          title: 'Shorten the project end date', proposed: `End the project on ${perm.expiration}.`, creative: 'No creative change; run time shortens.',
          permission: 'All assets are re-checked against the new dates.', effort: 'Low', followUp: 'Confirm the shorter run with the client.', effect: { k: 'project', patch: { end: perm.expiration } },
        }))
      return [...opts, remove]
    }
    case 'attribution': return [mk('add_attribution', {
      title: 'Add the required credit', proposed: `Add "${perm?.attribution}" to the end card or caption.`, creative: 'A small credit line is added.',
      permission: 'Meets the attribution condition once added.', effort: 'Low', followUp: 'Check the credit is visible in the final cut.', effect: { k: 'attribution' },
    })]
    case 'approval': return [ask({ kind: 'approval' }, 'approve this use'), replace]
    default: return [mk('human_review', {
      title: 'Request human verification', proposed: 'Send this permission record to a reviewer.', creative: 'None.',
      permission: 'Stays unverified until a reviewer confirms documentation.', effort: 'Medium', followUp: 'Upload any missing license document.', effect: { k: 'review', section: perm?.docs ? 'verification' : 'clarification' },
    }), replace, remove]
  }
}
