import type { ComponentType } from 'react'

export interface SectionDef {
  id: string
  label: string
  blurb: string
}

// How a lesson maps onto the platform: what it teaches and which future
// systems it unlocks. Kept on the registry entry so surfaces beyond the
// module body can use it.
export interface ModuleFrame {
  teaches: string
  unlocks: string[]
  planes: string[]
}

export interface ModuleDef {
  id: string
  title: string
  subtitle: string
  component: ComponentType
  section: string
  trackable?: boolean
  frame?: ModuleFrame
}

export interface SectionWithModules extends SectionDef {
  modules: ModuleDef[]
}
