import { useNavigate } from 'react-router-dom'
import { Box, Grid, Stack, Typography, Button } from '@mui/material'
import { InputFormAuth } from './custom-elements/InputFormAuth'
import { useState } from 'react'
import { useAuth } from '../context/auth-context'

const inputItems = [
    { type: 'text', label: 'Email', name: 'email' },
    { type: 'password', label: 'Mot de passe', name: 'password' },
]

export function LogInComponent() {
    const navigate = useNavigate()
    const { login } = useAuth()
    const [form, setForm] = useState({ email: '', password: '' })
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState(null)
    function handleClick() {
        navigate('/auth/signup')
    }

    async function handleSubmit(e) {
        e.preventDefault()
        setLoading(true)
        setError(null)
        try {
            await login(form.email, form.password)
            // After successful login navigate to DataVisualization
            navigate('/visualization')
        } catch (err) {
            setError(err.message)
        } finally {
            setLoading(false)
        }
    }

    function handleChange(e) {
        setForm({ ...form, [e.target.name]: e.target.value })
    }

    return (
        <Grid
            component="form"
            onSubmit={handleSubmit}
            container
            spacing={0}
            sx={{
                width: '100%',
                minHeight: '100vh',
                p: { xs: 1.5, sm: 2 }
            }}
        >
            <Grid
                size={{ xs: 12, md: 7.5 }}
                sx={{
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'center',
                    alignItems: 'center',
                    p: { xs: 1, sm: 2, md: 4 }
                }}
            >
                <Box component="img" src="/images/sfi_logo_secondary.png" sx={{ alignSelf: { xs: 'center', md: 'start' }, width: { xs: 48, sm: 55 } }} />

                <Stack
                    spacing={{ xs: 3, sm: 4, md: 5 }}
                    sx={{
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        mt: { xs: 2, sm: 2.5, md: 1 },
                        width: { xs: '100%', sm: '90%', md: '75%' },
                        maxWidth: 560,
                    }}>
                    <Stack spacing={1} sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center' }}>
                        <Typography sx={{ fontSize: { xs: 24, sm: 28, md: 30 } }} fontWeight={600}>
                            Accédez à votre dashboard
                        </Typography>

                        <Typography sx={{ fontSize: { xs: 13, sm: 14 }, color: '#808080', px: { xs: 1, sm: 0 } }} fontWeight={400}>
                            Entrez votre email et votre mot de passe pour accéder à votre compte.
                        </Typography>
                    </Stack>

                    {/* Section formulaire */}
                    <Stack spacing={{ xs: 2.5, sm: 3.5, md: 4 }} sx={{ width: '100%' }}>
                        {inputItems.map((item, idx) => (
                            <InputFormAuth key={idx} type={item.type} name={item.name} label={item.label} value={form[item.name] || ''} onChange={handleChange} />
                        ))}
                    </Stack>

                    <Stack spacing={2} sx={{ display: 'flex', alignItems: 'center', width: '100%' }}>
                        <Button
                            type="submit"
                            disabled={loading}
                            variant="contained"
                            sx={{ width: '100%', fontSize: { xs: 16, sm: 17 }, textTransform: 'none' }}
                            size="large">
                            {loading ? 'Connexion...' : 'Se Connecter'}
                        </Button>
                        {error && <Typography color="error">{error}</Typography>}

                        {/* Pas de compte? */}
                        <Typography sx={{ color: '#B3B3B3', textAlign: 'center' }}>
                            Vous n'avez pas de compte ?{' '}
                            <Typography
                                component="span"
                                fontWeight={500}
                                onClick={handleClick}
                                sx={{ textDecoration: 'underline', color: 'primary.main', cursor: 'pointer' }}>
                                Inscrivez-vous maintenant
                            </Typography>
                        </Typography>
                    </Stack>
                </Stack>
            </Grid>

            <Grid
                size={{ xs: 0, md: 4.5 }}
                sx={{
                    display: { xs: 'none', md: 'flex' },
                    alignItems: 'center',
                    justifyContent: 'center',
                    minHeight: '100vh',
                    pl: 2
                }}>
                <Box component="img" src="/images/right_side.png" sx={{ height: '100%', maxHeight: '100vh', objectFit: 'cover', borderRadius: 2 }} />
            </Grid>
        </Grid>
    )
}
