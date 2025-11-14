import { useNavigate } from 'react-router-dom'
import { Box, Grid, Stack, Typography, Button } from '@mui/material'
import { InputFormAuth } from './custom-elements/InputFormAuth'
import { useState, useContext } from 'react'
import AuthContext from '../context/AuthContext'

const inputItems = [
    { type: 'text', label: 'Email', name: 'email' },
    { type: 'password', label: 'Mot de passe', name: 'password' },
]

export function LogInComponent() {
    const navigate = useNavigate()
    const { login } = useContext(AuthContext)
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
            navigate('/')
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
        <Grid component="form" onSubmit={handleSubmit} container spacing={2} sx={{ p: 2, width: '100%', height: '95vh' }}>
            <Grid size={7.5} sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', p: 4 }}>
                <Box component="img" src="/images/sfi_logo_secondary.png" sx={{ alignSelf: 'start', width: 55 }} />

                <Stack
                    spacing={5}
                    sx={{
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        mt: 1,
                        width: '75%',
                    }}>
                    <Stack spacing={1} sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                        <Typography fontSize={30} fontWeight={600}>
                            Accédez à votre dashboard
                        </Typography>

                        <Typography fontSize={14} fontWeight={400} sx={{ color: '#808080' }}>
                            Entrez votre email et votre mot de passe pour accéder à votre compte.
                        </Typography>
                    </Stack>

                    {/* Section formulaire */}
                    <Stack spacing={4} sx={{ width: '80%' }}>
                        {inputItems.map((item, idx) => (
                            <InputFormAuth key={idx} type={item.type} name={item.name} label={item.label} value={form[item.name] || ''} onChange={handleChange} />
                        ))}
                    </Stack>

                    <Stack spacing={2} sx={{ display: 'flex', alignItems: 'center', width: '80%' }}>
                        <Button
                            type="submit"
                            disabled={loading}
                            variant="contained"
                            sx={{ width: '100%', fontSize: 17, textTransform: 'none' }}
                            size="large">
                            {loading ? 'Connexion...' : 'Se Connecter'}
                        </Button>
                        {error && <Typography color="error">{error}</Typography>}

                        {/* Pas de compte? */}
                        <Typography sx={{ color: '#B3B3B3' }}>
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
                size={4.5}
                sx={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    height: '100%',
                }}>
                <Box component="img" src="/images/right_side.png" sx={{ height: '100%', objectFit: 'cover' }} />
            </Grid>
        </Grid>
    )
}
