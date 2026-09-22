import React from 'react'
import { fireEvent, render, waitFor } from '@testing-library/react-native'
import { SafeAreaProvider } from 'react-native-safe-area-context'
import LoginScreen from '../LoginScreen'

const mockGet = jest.fn()
const mockPost = jest.fn()
const mockSetToken = jest.fn()
const mockRefreshUser = jest.fn()

jest.mock('../api', () => ({
  __esModule: true,
  default: {
    get: (...args) => mockGet(...args),
    post: (...args) => mockPost(...args),
  },
  setToken: (...args) => mockSetToken(...args),
  loadApiUrl: jest.fn().mockResolvedValue(''),
  setApiUrl: jest.fn(),
  BUILT_IN_API_URL: 'http://127.0.0.1:6111/api/v1',
}))

jest.mock('../AuthContext', () => ({
  useAuth: () => ({
    user: null,
    refreshUser: mockRefreshUser,
    logout: jest.fn(),
  }),
}))

jest.mock('../theme', () => ({
  theme: {
    colors: {
      background: { backdrop: 'rgba(0,0,0,0.5)', authOverlay: 'rgba(255,255,255,0.9)' },
      action: { primary: '#123' },
      text: { primary: '#111', secondary: '#555', tertiary: '#999' },
      status: { error: '#f00' },
      border: { subtle: '#eee', strong: '#ccc', error: '#f00' },
    },
    radius: { sm: 4, md: 8, lg: 16 },
    typography: { h3: {}, body1: {}, body2: {} },
    spacing: [0, 4, 8, 12, 16, 20, 24, 28, 32, 36, 40],
    shadows: { z2: {} },
  },
}))

jest.mock('react-native-paper', () => {
  const React = require('react')
  const { Text: NativeText } = require('react-native')
  return {
    Text: ({ children, ...props }) => <NativeText {...props}>{children}</NativeText>,
    Divider: () => <NativeText>divider</NativeText>,
  }
})

jest.mock('../components/AppCard', () => {
  const React = require('react')
  const { View } = require('react-native')
  return ({ children }) => <View>{children}</View>
})

jest.mock('../components/AppInput', () => {
  const React = require('react')
  const { TextInput } = require('react-native')
  return ({ label, ...props }) => <TextInput testID={`input-${label}`} {...props} />
})

jest.mock('../components/AppSelect', () => {
  const React = require('react')
  const { Pressable, Text, View } = require('react-native')
  return ({ label, onChange, options, value, disabled }) => {
    const selected = options.find(option => option.value === value)
    return (
      <View>
        <Text>{selected?.label || label}</Text>
        {options.map(option => (
          <Pressable
            key={String(option.value)}
            testID={`opt-${label}-${option.value}`}
            disabled={disabled}
            onPress={() => onChange(option.value, option)}
          >
            <Text>{option.label}</Text>
          </Pressable>
        ))}
      </View>
    )
  }
})

jest.mock('../components/AppButton', () => {
  const React = require('react')
  const { Pressable, Text } = require('react-native')
  return ({ children, onPress, disabled }) => (
    <Pressable testID={`button-${typeof children === 'string' ? children : 'loading'}`} onPress={onPress} disabled={disabled}>
      <Text>{children}</Text>
    </Pressable>
  )
})

jest.mock('../components/KeyboardAwareScrollView', () => {
  const React = require('react')
  const { ScrollView } = require('react-native')
  return ({ children, ...props }) => <ScrollView {...props}>{children}</ScrollView>
})

const renderLogin = () =>
  render(
    <SafeAreaProvider initialMetrics={{ frame: { x: 0, y: 0, width: 360, height: 640 }, insets: { top: 0, left: 0, right: 0, bottom: 0 } }}>
      <LoginScreen />
    </SafeAreaProvider>
  )

describe('LoginScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockGet.mockImplementation(endpoint => {
      const responses = {
        '/auth/roles': {
          data: [
            { id: 1, nombre: 'Super Admin' },
            { id: 2, nombre: 'Admin' },
            { id: 3, nombre: 'Usuario' },
          ],
        },
        '/auth/usuarios-by-rol/2': {
          data: [
            { id: 23, nombre: 'Carla Huamanorqque', area: 'RECEPCIÓN PACKING', rolId: 2, passwordResetRequired: true },
            { id: 24, nombre: 'Rosa Navarrete', area: 'FRIO', rolId: 2, passwordResetRequired: false },
          ],
        },
      }
      return Promise.resolve(responses[endpoint] || { data: [] })
    })
    mockPost.mockResolvedValue({ data: { token: 'token-ok' } })
  })

  it('autocompleta la contraseña por defecto al seleccionar un usuario nuevo', async () => {
    const screen = renderLogin()

    await waitFor(() => {
      expect(screen.getByTestId('opt-Perfil-2')).toBeTruthy()
    })

    fireEvent.press(screen.getByTestId('opt-Perfil-2'))

    await waitFor(() => {
      expect(screen.getByTestId('opt-Usuario-23')).toBeTruthy()
    })

    fireEvent.press(screen.getByTestId('opt-Usuario-23'))

    await waitFor(() => {
      expect(screen.getByTestId('input-Contraseña').props.value).toBe('00000000')
    })
  })

  it('no autocompleta la contraseña para un usuario que ya cambió su clave', async () => {
    const screen = renderLogin()

    await waitFor(() => {
      expect(screen.getByTestId('opt-Perfil-2')).toBeTruthy()
    })

    fireEvent.press(screen.getByTestId('opt-Perfil-2'))

    await waitFor(() => {
      expect(screen.getByTestId('opt-Usuario-24')).toBeTruthy()
    })

    fireEvent.press(screen.getByTestId('opt-Usuario-24'))

    await waitFor(() => {
      expect(screen.getByTestId('input-Contraseña').props.value).toBe('')
    })
  })

  it('inicia sesión con la contraseña autocompletada para un usuario nuevo', async () => {
    const screen = renderLogin()

    await waitFor(() => {
      expect(screen.getByTestId('opt-Perfil-2')).toBeTruthy()
    })

    fireEvent.press(screen.getByTestId('opt-Perfil-2'))

    await waitFor(() => {
      expect(screen.getByTestId('opt-Usuario-23')).toBeTruthy()
    })

    fireEvent.press(screen.getByTestId('opt-Usuario-23'))

    await waitFor(() => {
      expect(screen.getByTestId('input-Contraseña').props.value).toBe('00000000')
    })

    fireEvent.press(screen.getByText('Iniciar sesión'))

    await waitFor(() => {
      expect(mockPost).toHaveBeenCalledWith('/auth/local-login', {
        usuarioId: 23,
        password: '00000000',
      })
      expect(mockSetToken).toHaveBeenCalledWith('token-ok')
      expect(mockRefreshUser).toHaveBeenCalledWith('token-ok')
    })
  })
})
