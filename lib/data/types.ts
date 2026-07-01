export type Sport =
  | 'nba'
  | 'mlb'
  | 'nfl'
  | 'nhl'
  | 'pokemon'
  | 'soccer'
  | 'f1'
  | 'ufc'
  | 'onepiece'
  | 'mtg'

export type Category = 'single' | 'sealed' | 'memorabilia'

export type Availability = 'in_stock' | 'sold_out' | 'preorder'

export type Grade = { company: 'PSA' | 'BGS' | 'SGC'; value: number }

export interface Product {
  id: string
  slug: string
  name: string
  category: Category
  sport: Sport
  player?: string
  team?: string
  league?: string
  year?: number
  brand?: string
  cardNumber?: string
  grade?: Grade
  price: number
  currency: 'USD'
  availability: Availability
  images: string[] // empty -> CardArt fallback used later
  featured?: boolean
  newArrival?: boolean
  valuation?: number
  description: string
}

export type BreakType = 'pyt' | 'random' | 'division'

export interface Spot {
  id: string
  label: string
  price: number
  available: boolean
}

export interface Break {
  id: string
  slug: string
  title: string
  sport: Sport
  breakType: BreakType
  boxes: string[]
  startsAt: string // literal ISO string
  status: 'upcoming' | 'live' | 'completed'
  spots: Spot[]
  description: string
}

export interface ProductFilter {
  category?: Category
  sport?: Sport
  grade?: 'PSA' | 'BGS' | 'SGC'
  minPrice?: number
  maxPrice?: number
  availability?: Availability
  sort?: 'price_asc' | 'price_desc' | 'newest' | 'value'
}
