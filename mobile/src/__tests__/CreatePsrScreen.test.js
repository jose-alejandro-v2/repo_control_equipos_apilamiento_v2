import React from 'react'
import { fireEvent, render, waitFor } from '@testing-library/react-native'
import CreatePsrScreen from '../screens/CreatePsrScreen'

const mockGet = jest.fn()
const mockPost = jest.fn()
const mockPut = jest.fn()
const mockPopTo = jest.fn()
let mockRouteParams = {}
let mockPickedDate = new Date(2026, 6, 24)

jest.mock('../api', () => ({
  __esModule: true,
  default: {
    get: (...args) => mockGet(...args),
    post: (...args) => mockPost(...args),
    put: (...args) => mockPut(...args),
  },
}))

jest.mock('@react-navigation/native', () => ({
  useRoute: () => ({ params: mockRouteParams }),
  useNavigation: () => ({
    popTo: mockPopTo,
    navigate: jest.fn(),
  }),
  useFocusEffect: (callback) => {
    const reactModule = require('react')
    reactModule.useEffect(() => {
      return callback()
    }, [callback])
  },
}))

jest.mock('../AuthContext', () => ({
  useAuth: () => ({
    user: { rolNombre: 'Super Admin' },
  }),
}))

jest.mock('../theme', () => ({
  theme: {
    colors: {
      background: { page: '#fff', neutral: '#eee' },
      text: { primary: '#111', secondary: '#555' },
    },
    radius: { sm: 4 },
    spacing: [0, 4, 8, 12, 16, 20, 24, 28, 32],
    typography: { title: {}, subtitle: {}, caption: {} },
  },
}))

jest.mock('@react-native-community/datetimepicker', () => {
  const React = require('react')
  const { Pressable, Text } = require('react-native')
  return function MockDateTimePicker({ onChange }) {
    return (
      <Pressable
        testID="date-picker"
        onPress={() => onChange({ type: 'set' }, mockPickedDate)}
      >
        <Text>Elegir fecha</Text>
      </Pressable>
    )
  }
})

jest.mock('react-native-paper', () => {
  const React = require('react')
  const { Pressable, Text: NativeText, View } = require('react-native')
  return {
    Text: ({ children }) => <NativeText>{children}</NativeText>,
    HelperText: ({ children }) => <NativeText>{children}</NativeText>,
    Divider: () => <View />,
    SegmentedButtons: ({ buttons, onValueChange, value }) => (
      <View>
        {buttons.map(button => (
          <Pressable
            key={button.value}
            testID={`currency-${button.value}`}
            onPress={() => onValueChange(button.value)}
          >
            <NativeText>{value === button.value ? `selected-${button.label}` : button.label}</NativeText>
          </Pressable>
        ))}
      </View>
    ),
    TouchableRipple: ({ children, ...props }) => (
      <Pressable {...props}>{children}</Pressable>
    ),
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

jest.mock('../components/AppTextArea', () => {
  const React = require('react')
  const { TextInput } = require('react-native')
  return ({ label, ...props }) => <TextInput testID={`input-${label}`} {...props} />
})

jest.mock('../components/AppSelect', () => {
  const React = require('react')
  const { Pressable, Text } = require('react-native')
  return ({ label, onChange, options, value }) => {
    const selected = options.find(option => option.value === value)
    return (
      <Pressable
        testID={`select-${label}`}
        onPress={() => options[0] && onChange(options[0].value)}
      >
        <Text>{selected?.label || 'Seleccionar'}</Text>
        <Text>{options.map(option => option.label).join('|')}</Text>
      </Pressable>
    )
  }
})

jest.mock('../components/AppButton', () => {
  const React = require('react')
  const { Pressable, Text } = require('react-native')
  return ({ children, onPress }) => (
    <Pressable testID="create-psr" onPress={onPress}>
      <Text>{children}</Text>
    </Pressable>
  )
})

jest.mock('../components/ErrorBoundary', () => {
  const React = require('react')
  return ({ children }) => <>{children}</>
})

jest.mock('../components/LoadingScreen', () => {
  const React = require('react')
  const { Text } = require('react-native')
  return () => <Text>Cargando</Text>
})

jest.mock('../components/ErrorState', () => {
  const React = require('react')
  const { Text } = require('react-native')
  return ({ message }) => <Text>{message}</Text>
})

describe('CreatePsrScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockRouteParams = {}
    mockPickedDate = new Date(2026, 6, 24)
    mockPost.mockResolvedValue({ data: { success: true } })
    mockPut.mockResolvedValue({ data: { success: true } })
    mockGet.mockImplementation(endpoint => {
      const responses = {
        '/campanas': {
          data: {
            success: true,
            data: [
              { id: 1, nombre: '25-26', estadoActivo: false },
              { id: 2, nombre: '26-27', codigo: '2627', estadoActivo: true },
            ],
          },
        },
        '/sedes': {
          data: {
            success: true,
            data: [
              { id: 10, nombre: 'Packing Uva', codigo: 'PACKING_UVA', estadoActivo: true },
              { id: 11, nombre: 'Packing Arándano', codigo: 'PACKING_ARANDANO', estadoActivo: true },
            ],
          },
        },
        '/motivos-psr': {
          data: {
            success: true,
            data: [
              { id: 20, nombreCorto: 'Transpaleta - Litio', estadoActivo: true },
            ],
          },
        },
      }
      return Promise.resolve(responses[endpoint])
    })
  })

  it('carga catálogos, preselecciona campaña activa y crea el PSR', async () => {
    const screen = render(<CreatePsrScreen />)

    await waitFor(() => {
      expect(screen.getAllByText('26-27 (2627)').length).toBeGreaterThan(0)
      expect(screen.getByText(/Packing Uva/)).toBeTruthy()
      expect(screen.getByText('Transpaleta - Litio')).toBeTruthy()
    })

    fireEvent.press(screen.getByTestId('select-Sede'))
    fireEvent.press(screen.getByTestId('select-Motivo'))
    fireEvent.changeText(screen.getByTestId('input-Número PSR'), 'PSR-001')

    fireEvent.press(screen.getByLabelText('Seleccionar Fecha inicio de uso'))
    fireEvent.press(screen.getByTestId('date-picker'))
    fireEvent.press(screen.getByLabelText('Seleccionar Fecha fin de uso'))
    fireEvent.press(screen.getByTestId('date-picker'))
    fireEvent.press(screen.getByTestId('create-psr'))

    await waitFor(() => {
      expect(mockPost).toHaveBeenCalledWith('/psr', {
        campanaId: 2,
        sedeId: 10,
        numeroPsr: 'PSR-001',
        fechaPsr: expect.stringMatching(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}-\d{2}:\d{2}$/),
        motivoId: 20,
        fechaInicioUso: expect.stringMatching(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}-\d{2}:\d{2}$/),
        fechaFinUso: expect.stringMatching(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}-\d{2}:\d{2}$/),
        observaciones: null,
      })
      expect(mockPopTo).toHaveBeenCalledWith('PsrOsr')
    })
  })

  it('acepta inicio y fin el mismo día con horas distintas (regla por día como el backend)', async () => {
    const screen = render(<CreatePsrScreen />)

    await waitFor(() => {
      expect(screen.getAllByText('26-27 (2627)').length).toBeGreaterThan(0)
    })

    fireEvent.press(screen.getByTestId('select-Sede'))
    fireEvent.press(screen.getByTestId('select-Motivo'))
    fireEvent.changeText(screen.getByTestId('input-Número PSR'), 'PSR-002')

    mockPickedDate = new Date(2026, 6, 24, 18, 30)
    fireEvent.press(screen.getByLabelText('Seleccionar Fecha inicio de uso'))
    fireEvent.press(screen.getByTestId('date-picker'))

    mockPickedDate = new Date(2026, 6, 24, 9, 0)
    fireEvent.press(screen.getByLabelText('Seleccionar Fecha fin de uso'))
    fireEvent.press(screen.getByTestId('date-picker'))

    fireEvent.press(screen.getByTestId('create-psr'))

    await waitFor(() => {
      expect(mockPost).toHaveBeenCalledWith('/psr', expect.objectContaining({
        fechaInicioUso: '2026-07-24T18:30:00-05:00',
        fechaFinUso: '2026-07-24T09:00:00-05:00',
      }))
    })
    expect(screen.getByTestId('input-Fecha fin de uso').props.errorMessage).toBeUndefined()
  })

  it('bloquea el envío cuando la fecha de fin es anterior a la de inicio', async () => {
    const screen = render(<CreatePsrScreen />)

    await waitFor(() => {
      expect(screen.getAllByText('26-27 (2627)').length).toBeGreaterThan(0)
    })

    fireEvent.press(screen.getByTestId('select-Sede'))
    fireEvent.press(screen.getByTestId('select-Motivo'))
    fireEvent.changeText(screen.getByTestId('input-Número PSR'), 'PSR-003')

    mockPickedDate = new Date(2026, 6, 24)
    fireEvent.press(screen.getByLabelText('Seleccionar Fecha inicio de uso'))
    fireEvent.press(screen.getByTestId('date-picker'))

    mockPickedDate = new Date(2026, 6, 23)
    fireEvent.press(screen.getByLabelText('Seleccionar Fecha fin de uso'))
    fireEvent.press(screen.getByTestId('date-picker'))

    fireEvent.press(screen.getByTestId('create-psr'))

    await waitFor(() => {
      expect(screen.getByTestId('input-Fecha fin de uso').props.errorMessage)
        .toBe('La fecha de fin debe ser igual o posterior a la fecha de inicio')
    })
    expect(mockPost).not.toHaveBeenCalled()
  })

  it('muestra el PSR como solo lectura y guarda una OSR relacionada', async () => {
    mockRouteParams = {
      mode: 'osr',
      psr: {
        id: 99,
        campanaId: 2,
        sedeId: 10,
        numeroPsr: 'PSR001',
        fechaPsr: '2026-07-24',
        motivoId: 20,
        fechaInicioUso: '2026-07-24',
        fechaFinUso: '2026-08-24',
        observaciones: 'Registro base',
      },
    }

    const screen = render(<CreatePsrScreen />)

    await waitFor(() => {
      expect(screen.getByText('Datos de la OSR')).toBeTruthy()
    })

    expect(screen.getByTestId('input-Número PSR').props.editable).toBe(false)
    fireEvent.changeText(screen.getByTestId('input-Número OSR'), 'OSR001')
    fireEvent.changeText(screen.getByTestId('input-Costo unitario'), '750.50')
    fireEvent.press(screen.getByTestId('currency-USD'))
    fireEvent.press(screen.getByTestId('create-psr'))

    await waitFor(() => {
      expect(mockPost).toHaveBeenCalledWith('/osr', {
        psrId: 99,
        numeroOsr: 'OSR001',
        costoUnitario: 750.5,
        tipoMoneda: 'USD',
      })
      expect(mockPopTo).toHaveBeenCalledWith('PsrOsr')
    })
  })

  it('edita PSR y OSR manteniendo ambos números como solo lectura', async () => {
    mockRouteParams = {
      psr: {
        id: 99,
        campanaId: 2,
        sedeId: 10,
        numeroPsr: 'PSR001',
        fechaPsr: '2026-07-24',
        motivoId: 20,
        fechaInicioUso: '2026-08-01',
        fechaFinUso: '2026-10-31',
        observaciones: 'Registro base',
        osr: {
          id: 100,
          numeroOsr: 'OSR001',
          costoUnitario: 750.5,
          tipoMoneda: 'PEN',
        },
      },
    }

    const screen = render(<CreatePsrScreen />)

    await waitFor(() => {
      expect(screen.getByText('Editar PSR')).toBeTruthy()
    })

    expect(screen.getByTestId('input-Número PSR').props.editable).toBe(false)
    expect(screen.getByTestId('input-Número OSR').props.editable).toBe(false)
    fireEvent.changeText(screen.getByTestId('input-Costo unitario'), '825.40')
    fireEvent.press(screen.getByTestId('currency-USD'))
    fireEvent.press(screen.getByTestId('create-psr'))

    await waitFor(() => {
      expect(mockPut).toHaveBeenCalledWith('/psr/99', {
        campanaId: 2,
        sedeId: 10,
        numeroPsr: 'PSR001',
        fechaPsr: '2026-07-24',
        motivoId: 20,
        fechaInicioUso: '2026-08-01',
        fechaFinUso: '2026-10-31',
        observaciones: 'Registro base',
        osr: {
          costoUnitario: 825.4,
          tipoMoneda: 'USD',
        },
      })
      expect(mockPopTo).toHaveBeenCalledWith('PsrOsr')
    })
  })
})
