import type { MDXComponents } from 'mdx/types'

import * as shared from '@/components/shared'
import * as labs from '@/components/labs'
import PayoffChart from '@/components/PayoffChart'

// Components made available to every .mdx lesson without an import — authors
// write <Callout>, <LegLab />, etc. as if they were markdown primitives.
export const mdxComponents: MDXComponents = {
  ...shared,
  ...labs,
  PayoffChart,
}
