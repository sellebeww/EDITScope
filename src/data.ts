import type { Asset, AssetType, Permission, Project, ProjectAsset, Review, State, Verification } from './types'

export const USAGES = ['Organic social media', 'Paid advertising', 'Website', 'Commercial campaign', 'Internal presentation', 'Educational content']
export const CHANNELS = ['Instagram', 'TikTok', 'YouTube', 'Facebook', 'Website', 'Television', 'Other']
export const REGIONS = ['Worldwide', 'United States', 'Canada', 'United Kingdom', 'European Union', 'Asia-Pacific']
export const TYPES: AssetType[] = ['Image', 'Video', 'Audio', 'Illustration', 'Font', 'Logo', 'Other']
const WW = ['Worldwide']

// Demo photos live in public/demo (CC0 / public domain, see CREDITS.md). Only seeded ids have one; the two logo assets
// are fictional brands and uploaded assets or new projects have none, so they keep the icon / gradient placeholder.
// Relative URL so it also works when the app is served from a sub-path (e.g. GitHub Pages).
const DEMO_PHOTO_IDS = new Set([...Array.from({ length: 18 }, (_, i) => `a${String(i + 1).padStart(2, '0')}`), 'p1', 'p2', 'p3', 'p4'])
export const demoPhoto = (id: string) => (DEMO_PHOTO_IDS.has(id) ? `demo/${id}.jpg` : undefined)

const A = (n: string, name: string, type: AssetType, creator: string, source: string, file: string): Asset =>
  ({ id: `a${n}`, name, type, creator, source, fileName: file, permissionId: `PERM-0${n}`, addedAt: '2026-05-12' })
export const SEED_ASSETS: Asset[] = [
  A('01', 'Urban Lifestyle Photo', 'Image', 'M. Alvarez', 'Lumen Stock', 'urban-lifestyle.jpg'),
  A('02', 'Beach Sunset Hero', 'Image', 'T. Okafor', 'FrameHouse', 'beach-sunset.jpg'),
  A('03', 'Studio Product Shot', 'Image', 'Northstar Studio', 'In-house', 'product-shot.png'),
  A('04', 'Street Market Crowd', 'Image', 'L. Chen', 'Lumen Stock', 'street-market.jpg'),
  A('05', 'Rooftop Party Photo', 'Image', 'Unknown', 'Shared drive', 'rooftop-party.jpg'),
  A('06', 'Product Video Clip', 'Video', 'Motionly Films', 'Motionly', 'product-clip.mp4'),
  A('07', 'City Drone Footage', 'Video', 'SkyReel Co.', 'SkyReel', 'city-drone.mov'),
  A('08', 'Customer Testimonial Clip', 'Video', 'Northstar Studio', 'In-house', 'testimonial.mp4'),
  A('09', 'Beach Waves B-Roll', 'Video', 'SkyReel Co.', 'SkyReel', 'waves-broll.mp4'),
  A('10', 'Summer Vibes Audio', 'Audio', 'Kai Rivers', 'Soundgrove', 'summer-vibes.mp3'),
  A('11', 'Soft Piano Loop', 'Audio', 'Mira Cole', 'Soundgrove', 'soft-piano.wav'),
  A('12', 'Voiceover – Brand Tagline', 'Audio', 'Northstar Studio', 'In-house', 'vo-tagline.wav'),
  A('13', 'Vintage Illustration', 'Illustration', 'Unknown', 'Email attachment', 'vintage-illustration.png'),
  A('14', 'Geometric Pattern Set', 'Illustration', 'Patternly', 'Patternly', 'patterns.svg'),
  A('15', 'Hand-drawn Icons', 'Illustration', 'Inkwell Studio', 'Inkwell', 'icons.svg'),
  A('16', 'Character Mascot Art', 'Illustration', 'R. Dube', 'Commissioned', 'mascot.png'),
  A('17', 'Nordic Sans', 'Font', 'FontForge Co.', 'FontForge', 'nordic-sans.otf'),
  A('18', 'Open Grotesk', 'Font', 'Open Type Group', 'Open source', 'open-grotesk.ttf'),
  A('19', 'Northwind Brand Logo', 'Logo', 'Northwind Beverages', 'Client', 'northwind-logo.svg'),
  A('20', 'Aurora Partner Logo', 'Logo', 'Aurora Co.', 'Client', 'aurora-logo.svg'),
]

interface PO { uses?: string[]; ch?: string[]; reg?: string[]; com?: boolean | null; exp?: string | null; attr?: string | null; appr?: boolean; restr?: string; docs?: string | null; ver?: Verification; restricted?: string[] }
const P = (n: string, holder: string, license: string, o: PO = {}): Permission => ({
  id: `PERM-0${n}`, assetId: `a${n}`, rightsHolder: holder, licenseType: license,
  permittedUses: o.uses ?? USAGES, restrictedUses: o.restricted ?? [], permittedChannels: o.ch ?? CHANNELS, permittedRegions: o.reg ?? WW,
  commercial: o.com === undefined ? true : o.com, expiration: o.exp === undefined ? null : o.exp, attribution: o.attr ?? null, approvalRequired: !!o.appr,
  restrictions: o.restr ?? '', docs: o.docs === undefined ? `${license.replace(/\s+/g, '-')}-${n}.pdf` : o.docs, verification: o.ver ?? 'verified',
  reviewerId: (o.ver ?? 'verified') === 'verified' ? 'u3' : null, lastReviewed: (o.ver ?? 'verified') === 'verified' ? '2026-05-20' : null,
  history: (o.ver ?? 'verified') === 'verified' ? [{ at: '2026-05-20', by: 'u3', note: 'Documentation checked and verified.' }] : [],
})
export const SEED_PERMS: Permission[] = [
  P('01', 'Lumen Stock', 'Royalty-free commercial', { exp: '2028-05-01' }),
  P('02', 'FrameHouse', 'Regional commercial', { reg: ['United States', 'Canada', 'United Kingdom'], exp: '2027-03-15' }),
  P('03', 'Northstar Creative Studio', 'Owned (work for hire)', { docs: 'Work-for-hire-agreement.pdf' }),
  P('04', 'Lumen Stock', 'Editorial only', { uses: ['Organic social media', 'Website', 'Educational content'], com: false, exp: '2027-09-01', restricted: ['Paid advertising', 'Commercial campaign'], restr: 'Editorial use only. No advertising.' }),
  P('05', 'Unknown', 'Unknown', { ver: 'unverified', docs: null, com: null, uses: [], ch: [], reg: [] }),
  P('06', 'Motionly Films', 'Single-project commercial', { exp: '2026-03-31', restr: 'License valid for one year from purchase.' }),
  P('07', 'SkyReel Co.', 'Broadcast & web', { uses: ['Paid advertising', 'Website', 'Commercial campaign'], ch: ['YouTube', 'Website', 'Facebook', 'Television'], exp: '2027-12-31', restr: 'No short-form social platforms.' }),
  P('08', 'Northstar Creative Studio', 'Talent release', { attr: 'Featuring Jamie R., customer', docs: 'Talent-release-08.pdf' }),
  P('09', 'SkyReel Co.', 'Regional commercial', { reg: ['United States', 'Canada', 'European Union'], exp: '2027-06-30' }),
  P('10', 'Soundgrove', 'Social music license', { uses: ['Organic social media', 'Website'], ch: ['Instagram', 'TikTok', 'YouTube'], exp: '2027-06-30', restricted: ['Paid advertising'], restr: 'Licensed for social and web promotion only.' }),
  P('11', 'Soundgrove', 'Standard music license', { attr: 'Music: Soft Piano Loop by Mira Cole', exp: '2028-01-01' }),
  P('12', 'Northstar Creative Studio', 'Owned (work for hire)', { docs: 'Voice-talent-contract.pdf' }),
  P('13', 'Unknown', 'Unknown', { ver: 'unverified', docs: null, com: null, uses: [], ch: [], reg: [] }),
  P('14', 'Patternly', 'Royalty-free commercial', {}),
  P('15', 'Inkwell Studio', 'Non-commercial', { uses: ['Website', 'Internal presentation', 'Educational content'], ch: ['Website'], com: false, restricted: ['Commercial campaign', 'Paid advertising'], restr: 'Non-commercial use only.' }),
  P('16', 'R. Dube', 'Commission agreement', { ver: 'pending', docs: 'Commission-agreement-draft.pdf' }),
  P('17', 'FontForge Co.', 'Desktop license', { exp: '2026-12-15', restr: 'License renews annually.' }),
  P('18', 'Open Type Group', 'Open font license', { docs: 'OFL-1.1.txt' }),
  P('19', 'Northwind Beverages', 'Client brand license', { appr: true, restr: 'Brand approval required before publishing.', docs: 'Brand-guidelines.pdf' }),
  P('20', 'Aurora Co.', 'Partner brand license', { docs: 'Partner-guidelines.pdf' }),
]

const T = (id: string, assetId: string, track: ProjectAsset['track'], start: number, len: number, context: string): ProjectAsset => ({ id, assetId, track, start, len, context })
const proj = (o: Partial<Project> & Pick<Project, 'id' | 'name' | 'description' | 'client' | 'category' | 'ownerId' | 'usages' | 'channels' | 'region' | 'start' | 'end' | 'assets'>): Project =>
  ({ commercial: true, scope: 'Public', updatedAt: '2026-11-07', recStatus: {}, actions: [], lastChecked: '2026-11-07T09:00:00Z', ...o })
export const SEED_PROJECTS: Project[] = [
  proj({
    id: 'p1', name: 'Summer Campaign 2026', description: 'Paid social teaser and hero video for the summer beverage line.', client: 'Northwind Beverages', category: 'Advertising', ownerId: 'u2',
    usages: ['Paid advertising'], channels: ['Instagram', 'TikTok'], region: 'United States', start: '2026-06-01', end: '2026-08-31', scope: 'Public, paid reach',
    assets: [T('t1', 'a01', 'Image', 0, 8, 'Opening scene'), T('t2', 'a07', 'Video', 8, 16, 'City montage'), T('t3', 'a09', 'Video', 24, 16, 'Beach montage'), T('t4', 'a03', 'Image', 16, 8, 'Product reveal'),
      T('t5', 'a05', 'Image', 28, 6, 'Party cutaway'), T('t6', 'a10', 'Audio', 0, 45, 'Background music'), T('t7', 'a19', 'Graphics', 36, 9, 'End card logo')],
  }),
  proj({
    id: 'p2', name: 'Product Launch Video', description: 'Hero video for the launch page and YouTube.', client: 'Northwind Beverages', category: 'Video', ownerId: 'u2',
    usages: ['Commercial campaign', 'Website'], channels: ['YouTube', 'Website'], region: 'Worldwide', start: '2026-09-01', end: '2026-12-31', updatedAt: '2026-11-05',
    assets: [T('t1', 'a06', 'Video', 0, 20, 'Product demo'), T('t2', 'a08', 'Video', 20, 15, 'Testimonial'), T('t3', 'a11', 'Audio', 0, 40, 'Background music'), T('t4', 'a12', 'Audio', 5, 20, 'Voiceover'),
      T('t5', 'a02', 'Image', 35, 5, 'Closing still'), T('t6', 'a20', 'Graphics', 35, 5, 'Partner logo'), T('t7', 'a18', 'Graphics', 0, 40, 'On-screen text')],
  }),
  proj({
    id: 'p3', name: 'Brand Identity Refresh', description: 'Website and internal deck for the refreshed identity.', client: 'Aurora Co.', category: 'Branding', ownerId: 'u4',
    usages: ['Internal presentation', 'Website'], channels: ['Website'], region: 'Worldwide', start: '2026-10-01', end: '2027-01-31', updatedAt: '2026-11-03', scope: 'Internal + public site',
    assets: [T('t1', 'a13', 'Image', 0, 10, 'Cover art'), T('t2', 'a14', 'Image', 10, 10, 'Pattern backgrounds'), T('t3', 'a17', 'Graphics', 0, 30, 'Headings'), T('t4', 'a19', 'Graphics', 20, 10, 'Logo lockup'),
      T('t5', 'a15', 'Graphics', 10, 10, 'Icon set'), T('t6', 'a16', 'Image', 20, 10, 'Mascot page')],
  }),
  proj({
    id: 'p4', name: 'Digital Advertising Series', description: 'Six-part paid series for Facebook and YouTube.', client: 'Northwind Beverages', category: 'Advertising', ownerId: 'u2',
    usages: ['Paid advertising', 'Commercial campaign'], channels: ['Facebook', 'YouTube'], region: 'United States', start: '2026-11-15', end: '2027-02-15', updatedAt: '2026-11-08',
    assets: [T('t1', 'a02', 'Image', 0, 10, 'Hero still'), T('t2', 'a04', 'Image', 10, 8, 'Crowd cutaway'), T('t3', 'a09', 'Video', 18, 14, 'Beach scene'), T('t4', 'a12', 'Audio', 0, 30, 'Voiceover'),
      T('t5', 'a18', 'Graphics', 0, 30, 'Captions'), T('t6', 'a20', 'Graphics', 26, 4, 'Partner logo'), T('t7', 'a08', 'Video', 12, 6, 'Testimonial')],
  }),
]

export const SEED_REVIEWS: Review[] = [
  { id: 'r1', assetId: 'a05', projectId: 'p1', section: 'clarification', reason: 'Source and license for this photo are unknown.', missing: ['License document', 'Rights holder', 'Allowed uses'], reviewerId: 'u3', createdAt: '2026-11-04', priority: 'High', status: 'open', notes: [] },
  { id: 'r2', assetId: 'a16', projectId: 'p3', section: 'verification', reason: 'Commission agreement uploaded as a draft; needs confirmation.', missing: ['Signed copy'], reviewerId: 'u3', createdAt: '2026-11-02', priority: 'Medium', status: 'open', notes: [] },
  { id: 'r3', assetId: 'a19', projectId: 'p1', section: 'approval', reason: 'Brand approval requested from Northwind for paid use.', missing: [], reviewerId: 'u3', createdAt: '2026-11-06', priority: 'Medium', status: 'open', notes: [], grant: { kind: 'approval' } },
  { id: 'r4', assetId: 'a13', projectId: 'p3', section: 'clarification', reason: 'Documentation missing for the vintage illustration.', missing: ['License document', 'Creator'], reviewerId: 'u3', createdAt: '2026-10-29', priority: 'High', status: 'open', notes: [] },
]

export const seed = (): State => ({
  users: [
    { id: 'u1', name: 'Dana Whitfield', email: 'dana@northstar.studio', role: 'Admin' },
    { id: 'u2', name: 'Priya Nair', email: 'priya@northstar.studio', role: 'Editor' },
    { id: 'u3', name: 'Marcus Lee', email: 'marcus@northstar.studio', role: 'Reviewer' },
    { id: 'u4', name: 'Sofia Reyes', email: 'sofia@northstar.studio', role: 'Editor' },
    { id: 'u5', name: 'Tom Becker', email: 'tom@northstar.studio', role: 'Viewer' },
  ],
  meId: null, workspace: { id: 'w1', name: 'Northstar Creative Studio', orgType: 'Creative Agency' }, onboarded: true,
  projects: SEED_PROJECTS, assets: SEED_ASSETS, permissions: SEED_PERMS, reviews: SEED_REVIEWS,
  audit: [{ id: 'l0', userId: 'u3', action: 'Verified permission PERM-001', entityType: 'permission', entityId: 'PERM-001', ts: '2026-05-20T10:00:00Z' }],
  notices: [
    { id: 'n1', kind: 'conflict', text: 'Summer Campaign 2026 contains permission conflicts.', ts: '2026-11-07T09:00:00Z', read: false, link: '/projects/p1' },
    { id: 'n2', kind: 'expiry', text: 'Nordic Sans license expires on 2026-12-15.', ts: '2026-11-06T09:00:00Z', read: false, link: '/permissions/PERM-017' },
    { id: 'n3', kind: 'verify', text: 'Character Mascot Art requires verification.', ts: '2026-11-02T09:00:00Z', read: false, link: '/review' },
    { id: 'n4', kind: 'docs', text: 'Reviewer requested documentation for Rooftop Party Photo.', ts: '2026-11-04T09:00:00Z', read: true, link: '/review' },
    { id: 'n5', kind: 'check', text: 'Digital Advertising Series completed a new rights check.', ts: '2026-11-08T09:00:00Z', read: true, link: '/projects/p4' },
  ],
})
