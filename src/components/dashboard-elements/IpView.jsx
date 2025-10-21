import { Grid, Typography, Stack } from '@mui/material'
import { DataGrid } from '@mui/x-data-grid'
import { North, South } from '@mui/icons-material'
import { SparklineSource } from '../custom-elements/SparklineSource'
import { GaugeFlow } from '../custom-elements/GaugeFlow'

export function IpView() {
    const destinationColumn = [
        { field: 'dest_netflow', headerName: 'IP destination (Netflow)', flex: 0.8 },
        { field: 'dest_passage_number', headerName: 'Nombre de passage', flex: 0.8 },
    ]

    const destinationRows = [
        { id: 1, dest_netflow: '192.168.1.10', dest_passage_number: 1200 },
        { id: 2, dest_netflow: '10.0.0.2', dest_passage_number: 4500 },
        { id: 3, dest_netflow: '172.16.5.7', dest_passage_number: 980 },
        { id: 4, dest_netflow: '192.168.1.15', dest_passage_number: 15000 },
        { id: 5, dest_netflow: '10.0.0.5', dest_passage_number: 7800 },
        { id: 6, dest_netflow: '192.168.2.20', dest_passage_number: 2300 },
        { id: 7, dest_netflow: '10.1.0.8', dest_passage_number: 5600 },
        { id: 8, dest_netflow: '172.16.8.12', dest_passage_number: 42000 },
        { id: 9, dest_netflow: '192.168.3.30', dest_passage_number: 1500 },
        { id: 10, dest_netflow: '10.2.0.15', dest_passage_number: 60000 },
        { id: 11, dest_netflow: '172.16.9.25', dest_passage_number: 8700 },
        { id: 12, dest_netflow: '192.168.4.40', dest_passage_number: 33000 },
    ]

    const sourceColumn = [
        { field: 'source_netflow', headerName: 'IP source (Netflow)', flex: 0.8 },
        { field: 'source_passage_number', headerName: 'Nombre de passage', flex: 0.8 },
    ]

    const sourceRows = [
        { id: 1, source_netflow: '192.168.1.10', source_passage_number: 2 },
        { id: 2, source_netflow: '10.0.0.5', source_passage_number: 1 },
        { id: 3, source_netflow: '172.16.0.12', source_passage_number: 3 },
        { id: 4, source_netflow: '192.168.2.15', source_passage_number: 1 },
        { id: 5, source_netflow: '10.0.1.8', source_passage_number: 2 },
        { id: 6, source_netflow: '172.16.1.22', source_passage_number: 2 },
        { id: 7, source_netflow: '192.168.3.9', source_passage_number: 3 },
        { id: 8, source_netflow: '10.0.2.14', source_passage_number: 1 },
        { id: 9, source_netflow: '172.16.2.33', source_passage_number: 3 },
        { id: 10, source_netflow: '192.168.4.20', source_passage_number: 2 },
        { id: 11, source_netflow: '10.0.3.25', source_passage_number: 2 },
        { id: 12, source_netflow: '172.16.3.40', source_passage_number: 1 },
    ]

    const now = new Date()

    const formatted =
        now.getFullYear() +
        '-' +
        String(now.getMonth() + 1).padStart(2, '0') +
        '-' +
        String(now.getDate()).padStart(2, '0') +
        ' ' +
        String(now.getHours()).padStart(2, '0') +
        ':' +
        String(now.getMinutes()).padStart(2, '0') +
        ':' +
        String(now.getSeconds()).padStart(2, '0')

    const makeIcon = (IconComp) => <IconComp sx={{ fontSize: 20, color: 'primary.light' }} />

    return (
        <Grid container spacing={1}>
            <Grid size={4} direction="column" container spacing={1}>
                <Typography fontWeight={600}>Destination</Typography>
                <DataGrid
                    columns={destinationColumn}
                    rows={destinationRows}
                    hideFooter
                    rowHeight={41}
                    disableColumnResize
                    sx={{
                        '& .MuiDataGrid-columnHeader': { backgroundColor: '#f9f9f9' },
                        '& .MuiDataGrid-row:nth-of-type(even)': { backgroundColor: '#f9f9f9' },
                        '& .MuiDataGrid-row:nth-of-type(odd)': { backgroundColor: '#ffffff' },
                    }}
                />
            </Grid>

            <Grid size={4} direction="column" container spacing={1}>
                <Typography fontWeight={600}>Source</Typography>
                <DataGrid
                    columns={sourceColumn}
                    rows={sourceRows}
                    hideFooter
                    rowHeight={41}
                    disableColumnResize
                    sx={{
                        '& .MuiDataGrid-columnHeader': { backgroundColor: '#f9f9f9' },
                        '& .MuiDataGrid-row:nth-of-type(even)': { backgroundColor: '#f9f9f9' },
                        '& .MuiDataGrid-row:nth-of-type(odd)': { backgroundColor: '#ffffff' },
                    }}
                />
            </Grid>

            <Grid size={4} direction="column" container spacing={1}>
                <Typography fontWeight={600}>{`Temps: ${formatted}`}</Typography>
                <Stack spacing={1}>
                    <SparklineSource icon={makeIcon(North)} title={'Max netflow.octet_delta_count'} />

                    <GaugeFlow
                        icon={makeIcon(North)}
                        title={'Max destination.bytes'}
                        description={'Pic du trafic sortant, charge maximale émise.'}
                        gaugeValue={64.7}
                        gaugeColor={'#E05B5B'}
                        dataUnite={'MB/s'}
                        layoutType="row"
                    />

                    <GaugeFlow
                        icon={makeIcon(South)}
                        title={'Max sources.bytes'}
                        description={'Pic du trafic entrant, réception maximale.'}
                        gaugeValue={80.3}
                        gaugeColor={'#52B57D'}
                        dataUnite={'kB/s'}
                        layoutType="row"
                    />
                </Stack>
            </Grid>
        </Grid>
    )
}
