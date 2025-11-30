import { Stack } from 'expo-router';
import { StatusBar } from 'react-native';

// Este ficheiro é o "chefe" da navegação.
// Ele diz ao Expo Router para tratar as nossas telas como um "Stack"
// (uma pilha de telas) e esconde a barra de título.

export default function RootLayout() {
  return (
    <>
      {/* Define a cor dos ícones (ex: bateria, Wi-Fi) como clara */}
      <StatusBar barStyle="light-content" backgroundColor="#548a8a" />
      
      <Stack
        screenOptions={{
          headerShown: false, // Esconde a barra de título
          contentStyle: { backgroundColor: '#548a8a' }, // Cor de fundo padrão
        }}
      >
        {/* Isto configura as 3 telas. O nome do ficheiro = o nome da rota.
          index.jsx = /
          formulario.jsx = /formulario
          sucesso.jsx = /sucesso
        */}
        <Stack.Screen name="index" />
        <Stack.Screen name="formulario" />
        <Stack.Screen name="sucesso" />
      </Stack>
    </>
  );
}