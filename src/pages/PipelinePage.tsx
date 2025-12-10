import { AppShell } from '../components/layout/AppShell'
import { PipelineBoard } from '../components/pipeline/PipelineBoard'

export function PipelinePage() {
  return (
    <AppShell>
      <PipelineBoard />
    </AppShell>
  )
}
