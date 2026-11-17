export const ASSETS = {
  HERO_VIDEO:
    'https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20261021_093331_5998f443-1b9c-4b62-820c-8219c73c72c4.mp4',
  HERO_POSTER:
    'https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20261021_093215_b7826239-e451-4e15-b42b-d6bcf9497a32.png',
  CLOUD_A:
    'https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20261021_093216_44218665-b15e-4566-a2d4-2676ab03609d.png',
  CLOUD_B:
    'https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20261021_093215_0f37c0c3-f82c-485b-87dd-5a35b75a8782.png',
  TREE:
    'https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20261021_093215_95f11900-c4a0-49ad-bb2d-bb927dd594ee.png',
  NIGHT:
    'https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20261021_093217_cc690198-ad8c-4127-8734-8485bd878351.png',
} as const;

export type CraftCategoryId = 'bangles' | 'florals' | 'diy';

export interface CraftPalette {
  id: string;
  label: string;
  primary: string;
  secondary: string;
  accent: string;
  ribbon: string;
}

export const CRAFT_PALETTES: CraftPalette[] = [
  {
    id: 'blossom',
    label: 'Blossom Pink',
    primary: '#e57ea3',
    secondary: '#f7c5d8',
    accent: '#d8a648',
    ribbon: '#c9537b',
  },
  {
    id: 'sunflower',
    label: 'Sunflower Gold',
    primary: '#e8a825',
    secondary: '#f6d878',
    accent: '#6e4c1e',
    ribbon: '#4d6a10',
  },
  {
    id: 'sage',
    label: 'Sage Olive',
    primary: '#6f9a0c',
    secondary: '#b4cd52',
    accent: '#e2c265',
    ribbon: '#4d6a10',
  },
  {
    id: 'lavender',
    label: 'Lavender Mist',
    primary: '#977ec4',
    secondary: '#d5c7ee',
    accent: '#d8a648',
    ribbon: '#6e589c',
  },
];

export const CRAFT_CATEGORIES: Array<{
  id: CraftCategoryId;
  label: string;
  shortDesc: string;
  formValue: string;
}> = [
  {
    id: 'bangles',
    label: 'Bangle Stack',
    shortDesc: 'Silk-thread & kundan sets wrapped to your exact wrist size.',
    formValue: 'Handmade Bangles',
  },
  {
    id: 'florals',
    label: 'Pipe Cleaner Bouquet',
    shortDesc: 'Everlasting chenille tulips, daisies, and sunflowers.',
    formValue: 'Pipe Cleaner Crafts',
  },
  {
    id: 'diy',
    label: 'DIY Craft Kit',
    shortDesc: 'Curated wire stems, silk spools, beads, and step guide.',
    formValue: 'DIY Craft Kit',
  },
];

export const BRAND_STATS = [
  { label: 'Instagram Showcase Posts', target: 22, decimals: 0, suffix: '' },
  { label: 'Community Followers', target: 45, decimals: 0, suffix: '+' },
  { label: 'Handmade to Order', target: 100, decimals: 0, suffix: '%' },
  { label: 'Signature Craft Lines', target: 3, decimals: 0, suffix: '' },
];

export const ACCORDION_STEPS = [
  {
    num: 1,
    title: 'Pick your craft & palette',
    description:
      'Preview silk-thread bangle stacks, everlasting pipe-cleaner bouquets, or curated DIY craft boxes in 3D before choosing your favorite shades.',
    cloud: ASSETS.CLOUD_B,
  },
  {
    num: 2,
    title: 'Share your custom brief',
    description:
      'Send your wrist measurement, flower preference, gift note, and timeline through the enquiry form—or copy the formatted summary straight to Instagram DM.',
    cloud: ASSETS.CLOUD_A,
  },
  {
    num: 3,
    title: 'Handcrafted & dispatched',
    description:
      'Every bangle and chenille petal is wrapped, twisted, and checked by hand at Bloom by Kavi, then packed with care for delivery.',
    cloud: ASSETS.CLOUD_B,
  },
];
