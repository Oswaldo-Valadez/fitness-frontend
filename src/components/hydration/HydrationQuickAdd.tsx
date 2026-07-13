import { useState } from 'react'
import dayjs from 'dayjs'
import { hydrationApi } from '@/api/hydration'
import { normalizeApiError } from '@/api/errors'
import { newIdempotencyKey } from '@/api/templates'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import { useToast } from '@/components/ui/toast'

interface Props {
  onAdded: () => void
}

const QUICK_VOLUMES = [250, 350, 500, 750]

/**
 * Quick-add buttons + a custom-amount input. These are accesses of
 * convenience, not recommendations — no volume is presented as a target or
 * default goal. Each request carries a fresh idempotency key; a failed
 * request rolls back with no optimistic state left behind.
 */
export default function HydrationQuickAdd({ onAdded }: Props) {
  const { show } = useToast()
  const [loadingVolume, setLoadingVolume] = useState<number | null>(null)
  const [customOpen, setCustomOpen] = useState(false)
  const [customVolume, setCustomVolume] = useState('')
  const [customLoading, setCustomLoading] = useState(false)

  const addVolume = async (volumeMl: number) => {
    setLoadingVolume(volumeMl)
    try {
      await hydrationApi.createEntry({
        volume_ml: volumeMl,
        occurred_at: dayjs().format(),
        idempotency_key: newIdempotencyKey(),
      })
      show({ variant: 'success', message: `${volumeMl} ml de agua registrados.` })
      onAdded()
    } catch (error) {
      show({ variant: 'error', message: normalizeApiError(error).message })
    } finally {
      setLoadingVolume(null)
    }
  }

  const handleCustomAdd = async () => {
    const volume = Number(customVolume)
    if (!Number.isFinite(volume) || volume <= 0) {
      show({ variant: 'error', message: 'Ingresa un volumen válido.' })
      return
    }

    setCustomLoading(true)
    try {
      await hydrationApi.createEntry({
        volume_ml: volume,
        occurred_at: dayjs().format(),
        idempotency_key: newIdempotencyKey(),
      })
      show({ variant: 'success', message: `${volume} ml de agua registrados.` })
      setCustomVolume('')
      setCustomOpen(false)
      onAdded()
    } catch (error) {
      show({ variant: 'error', message: normalizeApiError(error).message })
    } finally {
      setCustomLoading(false)
    }
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-2" role="group" aria-label="Registrar agua rápidamente">
        {QUICK_VOLUMES.map((volume) => (
          <Button
            key={volume}
            variant="secondary"
            size="md"
            loading={loadingVolume === volume}
            disabled={loadingVolume !== null}
            onClick={() => addVolume(volume)}
          >
            {volume} ml
          </Button>
        ))}
        <Button variant="outline" size="md" onClick={() => setCustomOpen((open) => !open)} disabled={loadingVolume !== null}>
          Otro
        </Button>
      </div>

      {customOpen && (
        <div className="flex items-end gap-2">
          <Input
            id="hydration-custom-volume"
            label="Volumen (ml)"
            type="number"
            min={1}
            inputMode="numeric"
            autoFocus
            value={customVolume}
            onChange={(e) => setCustomVolume(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleCustomAdd()
            }}
          />
          <Button loading={customLoading} onClick={handleCustomAdd}>
            Registrar
          </Button>
        </div>
      )}
    </div>
  )
}
