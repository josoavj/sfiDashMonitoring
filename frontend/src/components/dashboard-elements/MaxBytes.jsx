import { GaugeFlow } from '../custom-elements/GaugeFlow'
import { North, South } from '@mui/icons-material'

const makeIcon = (IconComp) => <IconComp sx={{ fontSize: 20, color: 'primary.light' }} />

export function MaxBytes() {
    return (
        <>
            <GaugeFlow
                icon={makeIcon(North)}
                title={'Max destination.bytes'}
                description={'Pic du trafic sortant, charge maximale émise.'}
                gaugeValue={85}
                gaugeColor={'#E05B5B'}
                dataUnite={'GB/s'}
            />

            <GaugeFlow
                icon={makeIcon(South)}
                title={'Max sources.bytes'}
                description={'Pic du trafic entrant, réception maximale.'}
                gaugeValue={50}
                gaugeColor={'#52B57D'}
                dataUnite={'kB/s'}
            />
        </>
    )
}
