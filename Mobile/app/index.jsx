import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  SafeAreaView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { AZURE_API_URL } from '../config';

// --- MAPA DE PERFIS (Conforme sua regra de negócio) ---
const PERFIL_ADMIN = 1;
const PERFIL_TECNICO = 2;
const PERFIL_COLABORADOR = 3; 
// -----------------------------------------------------

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false); 
  const router = useRouter(); 

  const handleLogin = async () => {
    if (!email || !senha) {
      Alert.alert('Campos Vazios', 'Por favor, preencha o email e a senha.');
      return;
    }
    setLoading(true);

    try {
      // =================================================================
      // PASSO 1: AUTENTICAÇÃO (Verifica Email e Senha)
      // =================================================================
      const response = await fetch(`${AZURE_API_URL}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password: senha }),
      });

      // TRATAMENTO DE ERRO DE CREDENCIAIS
      if (!response.ok) {
        // Se for 400 ou 401, é certeza que errou senha ou email
        if (response.status === 400 || response.status === 401) {
            throw new Error('Email ou senha inválidos. Tente novamente.');
        }
        // Outros erros (500, etc)
        const errorData = await response.json(); 
        throw new Error(errorData.detail || 'Ocorreu um erro no servidor.');
      }

      const data = await response.json();
      const token = data.token; 

      if (!token) throw new Error('Erro de comunicação: Token não recebido.');

      // =================================================================
      // PASSO 2: AUTORIZAÇÃO (Verifica QUEM é o usuário)
      // =================================================================
      const meResponse = await fetch(`${AZURE_API_URL}/api/auth/me`, {
        method: 'GET',
        headers: { 
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}` 
        },
      });

      if (!meResponse.ok) {
          throw new Error('Falha ao verificar permissões do usuário.');
      }

      const meData = await meResponse.json();
      const idPerfilUsuario = meData.idPerfil || meData.IdPerfil;

      // === FILTRO DE ACESSO ESPECÍFICO ===
      
      // Bloqueio para ADMIN
      if (idPerfilUsuario === PERFIL_ADMIN) {
          throw new Error('Administradores devem utilizar o Desktop ou Web. Acesso não permitido via Mobile.');
      }

      // Bloqueio para TÉCNICO
      if (idPerfilUsuario === PERFIL_TECNICO) {
          throw new Error('Técnicos devem utilizar o Sistema Desktop ou Web. Acesso não permitido via Mobile.');
      }

      // Bloqueio Genérico (caso exista outro perfil não mapeado)
      if (idPerfilUsuario !== PERFIL_COLABORADOR) {
          throw new Error('Seu perfil de usuário não tem permissão para acessar este aplicativo.');
      }

      // =================================================================
      // PASSO 3: SUCESSO (É Colaborador)
      // =================================================================
      await AsyncStorage.setItem('jwt_token', token);
      router.replace('/home');

    } catch (error) {
      // Exibe o erro específico que criamos acima
      Alert.alert('Acesso Negado', error.message);
      
      // Limpa qualquer token que possa ter sido salvo no meio do processo
      await AsyncStorage.removeItem('jwt_token');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.card}>
        <Text style={styles.title}>HelpDesk</Text>
        <TextInput
          style={styles.input}
          placeholder="Email"
          placeholderTextColor="#999"
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          autoCapitalize="none"
        />

        <View style={styles.inputContainer}>
          <TextInput
            style={styles.passwordTextInput}
            placeholder="Senha"
            placeholderTextColor="#999"
            value={senha}
            onChangeText={setSenha}
            secureTextEntry={!showPassword} 
          />
          <TouchableOpacity
            style={styles.toggleButton}
            onPress={() => setShowPassword(!showPassword)}
            activeOpacity={0.7}
          >
            <Text style={{ fontSize: 22, color: '#999' }}>
              {showPassword ? '👁️' : '🔒'}
            </Text>
          </TouchableOpacity>
        </View>
        
        <TouchableOpacity
          style={styles.button}
          onPress={handleLogin}
          disabled={loading}>
          {loading ? (
            <ActivityIndicator color="#FFF" />
          ) : (
            <Text style={styles.buttonText}>Entrar</Text>
          )}
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#548a8a',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  card: {
    backgroundColor: 'white',
    borderRadius: 20,
    padding: 25,
    width: '100%',
    maxWidth: 400,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 5,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#548a8a',
    marginBottom: 30,
  },
  input: {
    width: '100%',
    height: 50,
    backgroundColor: '#f4f4f4',
    borderRadius: 10,
    paddingHorizontal: 15,
    fontSize: 16,
    marginBottom: 15,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    color: '#333',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
    height: 50,
    backgroundColor: '#f4f4f4',
    borderRadius: 10,
    marginBottom: 15,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  passwordTextInput: {
    flex: 1,
    height: '100%',
    paddingHorizontal: 15,
    fontSize: 16,
    color: '#333',
  },
  toggleButton: {
    paddingHorizontal: 10,
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  button: {
    width: '100%',
    height: 50,
    backgroundColor: '#548a8a',
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 10,
  },
  buttonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
});