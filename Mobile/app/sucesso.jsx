import { useLocalSearchParams, useRouter } from 'expo-router';
import {
  Image,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from 'react-native';

export default function SucessoScreen() {
  const router = useRouter();
  
  // 1. Receber os dados
  const params = useLocalSearchParams();
  const { id, data, status, urgenciaUsuario, prioridadeIA, sugestao } = params;

  // 2. Formatação
  const idNumerico = id ? String(id).padStart(4, '0') : '????';
  const anoAtual = new Date().getFullYear();
  const numeroChamado = `#CH-${anoAtual}-${idNumerico}`;

  let dataFormatada = new Date().toLocaleDateString('pt-BR');
  if (data) {
    try {
        const dataObj = new Date(data);
        if (dataObj.getFullYear() > 1) dataFormatada = dataObj.toLocaleDateString('pt-BR');
    } catch (e) {}
  }

  // Função de Cores
  const getPrioridadeColor = (p) => {
    // Normaliza para evitar erros de case (ex: "alta" vs "Alta")
    const val = p ? String(p).toLowerCase() : 'média';
    
    if (val.includes('urgente') || val.includes('crítica')) return '#e74c3c'; // Vermelho
    if (val.includes('alta')) return '#e67e22'; // Laranja Escuro
    if (val.includes('média')) return '#f39c12'; // Laranja Claro
    if (val.includes('baixa')) return '#2ecc71'; // Verde
    
    return '#3498db'; // Azul (Padrão para desconhecido)
  };

  // Lógica para exibir a Prioridade Final
  // Se a API mandou prioridadeIA, usamos ela. Se veio vazia, usamos "Média" (padrão do sistema).
  const prioridadeFinal = prioridadeIA && prioridadeIA !== "Não definida" ? prioridadeIA : "Média";

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        <View style={styles.sucessoContainer}>
          
          <Image
            source={{ uri: 'https://placehold.co/100x100/FFFFFF/548a8a?text=\u2713&font=montserrat' }}
            style={styles.checkIcon}
          />
          
          <Text style={styles.sucessoTitle}>Chamado Confirmado!</Text>
          <Text style={styles.sucessoSubtitle}>
            Seu chamado foi registrado com sucesso.
          </Text>

          <View style={styles.infoCard}>
            
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Número:</Text>
              <Text style={styles.infoValue}>{numeroChamado}</Text>
            </View>
            
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Data:</Text>
              <Text style={styles.infoValue}>{dataFormatada}</Text>
            </View>

            {/* 1. O que o usuário escolheu */}
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Sua Urgência:</Text>
              <Text style={styles.infoValue}>{urgenciaUsuario || 'Não informada'}</Text>
            </View>
            
            {/* 2. O que a IA/Sistema definiu */}
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Prioridade (IA):</Text>
              <Text style={[
                  styles.infoValue, 
                  { 
                    color: getPrioridadeColor(prioridadeFinal), 
                    fontWeight: 'bold',
                    // Destaca se a IA mudou a prioridade em relação ao usuário
                    textDecorationLine: (prioridadeFinal !== urgenciaUsuario) ? 'underline' : 'none'
                  }
                ]}>
                {prioridadeFinal}
              </Text>
            </View>
            
            <View style={[styles.infoRow, { borderBottomWidth: 0 }]}>
              <Text style={styles.infoLabel}>Status:</Text>
              <Text style={styles.infoValue}>{status || 'Aberto'}</Text>
            </View>

            {sugestao ? (
              <View style={styles.aiBox}>
                <View style={styles.aiHeader}>
                    <Text style={styles.aiLabel}>🤖 Sugestão da IA:</Text>
                </View>
                <Text style={styles.aiText}>
                    {sugestao}
                </Text>
              </View>
            ) : null}

          </View>

          <TouchableOpacity
            style={styles.buttonOutline}
            onPress={() => router.replace('/home')}
          >
            <Text style={styles.buttonOutlineText}>Voltar ao Início</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#548a8a',
  },
  scrollContainer: {
    flexGrow: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  sucessoContainer: {
    width: '100%',
    alignItems: 'center',
  },
  checkIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    marginBottom: 20,
  },
  sucessoTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: 'white',
    textAlign: 'center',
    marginBottom: 5,
  },
  sucessoSubtitle: {
    fontSize: 16,
    color: 'white',
    textAlign: 'center',
    marginBottom: 20,
    opacity: 0.9,
  },
  infoCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderRadius: 15,
    padding: 20,
    width: '100%',
    marginBottom: 30,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(84, 138, 138, 0.1)',
    paddingBottom: 10,
  },
  infoLabel: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#548a8a',
  },
  infoValue: {
    fontSize: 15,
    color: '#333',
    textAlign: 'right',
    flex: 1,
    marginLeft: 10,
  },
  aiBox: {
    marginTop: 15,
    backgroundColor: '#f0f8ff', 
    borderRadius: 10,
    padding: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#548a8a',
  },
  aiHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 5,
  },
  aiLabel: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#2c3e50',
  },
  aiText: {
    fontSize: 14,
    color: '#555',
    lineHeight: 20,
    textAlign: 'left',
  },
  buttonOutline: {
    width: '100%',
    height: 50,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 5,
    borderWidth: 2,
    borderColor: 'white',
    backgroundColor: 'rgba(255,255,255,0.1)'
  },
  buttonOutlineText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
});