import { TextField, InputAdornment, IconButton } from '@mui/material'
import { VisibilityOutlined, VisibilityOffOutlined } from '@mui/icons-material'
import { useState } from 'react'

// now forwards other props (value, onChange, etc.) to TextField
export function InputFormAuth({ type, name, label, ...rest }) {
    const [showPassword, setShowPassword] = useState(false)
    const isPassword = type === 'password'

    function handleClickShowPassword() {
        setShowPassword((show) => !show)
    }

    return (
        <TextField
            type={isPassword ? (showPassword ? 'text' : 'password') : type}
            name={name}
            label={label}
            size="small"
            sx={{ input: { color: '#505050' } }}
            slotProps={{
                input:
                    type === 'password'
                        ? {
                              endAdornment: (
                                  <InputAdornment position="end">
                                      <IconButton edge="end">
                                          {showPassword ? (
                                              <VisibilityOffOutlined
                                                  fontSize="small"
                                                  onClick={handleClickShowPassword}
                                                  sx={{ color: '#808080' }}
                                              />
                                          ) : (
                                              <VisibilityOutlined
                                                  fontSize="small"
                                                  onClick={handleClickShowPassword}
                                                  sx={{ color: '#808080' }}
                                              />
                                          )}
                                      </IconButton>
                                  </InputAdornment>
                              ),
                          }
                        : {},
            }}
            {...rest}
        />
    )
}
