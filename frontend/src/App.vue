<script setup>
import { ref, onMounted } from 'vue'
import axios from 'axios'
import RadarChart from './components/RadarChart.vue'

const questions = ref([])
const answers = ref({})
const result = ref(null)
const loading = ref(false)
const hasStarted = ref(false)
const ollamaReady = ref(false)

onMounted(async () => {
  try {
    const res = await axios.get('http://localhost:8000/api/questions')
    questions.value = res.data
    checkOllamaStatus()
    
    // Vérifie le statut de l'IA toutes les 5 secondes
    const interval = setInterval(async () => {
      if (!ollamaReady.value) {
        await checkOllamaStatus()
      } else {
        clearInterval(interval)
      }
    }, 5000)
  } catch (e) {
    console.error("Erreur chargement questions:", e)
  }
})

const checkOllamaStatus = async () => {
  try {
    const res = await axios.get('http://localhost:8000/api/ollama-status')
    ollamaReady.value = res.data.loaded
  } catch (e) {
    ollamaReady.value = false
  }
}

const startAssessment = () => {
  hasStarted.value = true
  setTimeout(() => {
    document.getElementById('assessment-section').scrollIntoView({ behavior: 'smooth' })
  }, 100)
}

const submitForm = async () => {
  loading.value = true
  try {
    const res = await axios.post('http://localhost:8000/api/analyze', {
      answers: answers.value
    })
    result.value = res.data
  } catch (e) {
    alert("Erreur lors de l'analyse. Le backend est-il lancé ?")
  } finally {
    loading.value = false
  }
}

const reset = () => {
  result.value = null
  answers.value = {}
  hasStarted.value = false
  window.scrollTo({ top: 0, behavior: 'smooth' })
}

// Fonction de formatage Markdown améliorée pour le rendu web
const formattedAdvice = (text) => {
  if (!text) return ''
  
  return text
    // 1. Remplace le gras (**texte**) par du bleu clair
    .replace(/\*\*(.*?)\*\*/g, '<strong class="text-blue-400 font-bold">$1</strong>')
    // 2. Transforme les lignes de puces (* texte) en éléments de liste fluides (pour l'enroulement)
    .replace(/^[\*\-]\s+(.*)$/gm, '<p class="block mb-3 text-slate-300"><span class="text-blue-500 font-bold mr-2">•</span>$1</p>')
}
</script>

<template>
  <div class="min-h-screen bg-slate-50 font-sans text-slate-900 pb-16">
    
    <div class="bg-slate-900 text-slate-400 text-xs py-2">
      <div class="container mx-auto px-6 flex items-center max-w-7xl">
        <span>Université - Projet Cybersécurité & IA</span>
      </div>
    </div>

    <nav class="bg-white shadow-sm sticky top-0 z-50">
      <div class="container mx-auto px-6 py-4 flex justify-between items-center max-w-7xl">
        <div class="flex items-center gap-3">
          <span class="text-3xl text-blue-700">🛡️</span>
          <div class="flex flex-col leading-tight">
            <strong class="text-slate-900 text-lg tracking-tight">CYBER MIRROR</strong>
            <span class="text-slate-500 text-[10px] tracking-widest font-semibold uppercase">Audit de Sécurité</span>
          </div>
        </div>
        <button v-if="!hasStarted && !result" @click="startAssessment" class="bg-blue-700 hover:bg-blue-800 text-white px-6 py-2 rounded font-medium transition">
          Faire le test
        </button>
      </div>
    </nav>

    <header v-if="!hasStarted && !result" class="relative bg-slate-900 text-white py-32 overflow-hidden">
      <div class="absolute inset-0 bg-gradient-to-br from-slate-900 to-blue-900 opacity-90"></div>
      <div class="container mx-auto px-6 relative z-10 max-w-7xl">
        <h1 class="text-5xl md:text-6xl font-bold mb-6 leading-tight max-w-2xl">
          L'IA qui révèle vos<br>failles numériques
        </h1>
        <p class="text-lg text-blue-100 mb-10 max-w-xl">
          Découvrez votre profil de risque face aux menaces (phishing, mots de passe, tracking) et recevez les conseils de notre Coach Cyber.
        </p>
        <button @click="startAssessment" class="bg-white text-slate-900 hover:bg-slate-100 px-8 py-3 font-semibold rounded transition shadow-lg">
          Démarrer l'audit gratuit
        </button>
      </div>
    </header>

    <main id="assessment-section" v-if="hasStarted || result" class="py-20">
      <div class="container mx-auto px-6 max-w-6xl">
        
        <div v-if="!result && !loading" class="mb-12 text-center md:text-left">
          <div class="hidden md:block w-12 h-1 bg-blue-700 mb-6"></div>
          <h2 class="text-3xl font-bold text-slate-900 mb-2">Questionnaire des habitudes numériques</h2>
          <p class="text-xl text-slate-600">Répondez honnêtement pour une analyse précise de l'IA.</p>
        </div>

        <div v-if="!result && !loading">
          <div class="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
            <div v-for="category in questions" :key="category.id" class="bg-white p-8 border border-slate-200 rounded-xl shadow-sm">
              <h3 class="text-xl font-bold text-blue-700 border-b border-slate-100 pb-4 mb-6 flex items-center gap-2">
                <span class="text-2xl">📋</span> {{ category.category }}
              </h3>
              
              <div v-for="q in category.questions" :key="q.id" class="mb-8 last:mb-0">
                <p class="font-semibold text-slate-800 mb-4">{{ q.text }}</p>
                <div class="flex flex-col gap-3">
                  <label v-for="(opt, index) in q.options" :key="index" class="flex items-start gap-3 cursor-pointer text-slate-600 hover:text-slate-900 bg-slate-50 p-3 rounded border border-slate-100 transition hover:border-blue-300 hover:bg-blue-50">
                    <input 
                      type="radio" 
                      :name="q.id" 
                      :value="opt.points" 
                      v-model="answers[q.id]"
                      class="mt-1 w-4 h-4 text-blue-600 bg-white border-gray-300 focus:ring-blue-500"
                    >
                    <span class="text-sm">{{ opt.text }}</span>
                  </label>
                </div>
              </div>
            </div>
          </div>

          <div class="text-center mt-8">
            <button @click="submitForm" class="bg-blue-700 hover:bg-blue-800 text-white px-10 py-4 rounded-lg font-bold text-lg shadow-xl transition transform hover:-translate-y-1 w-full md:w-auto">
              Générer mon profil cyber (Analyse IA)
            </button>
          </div>
        </div>

        <div v-if="loading" class="py-32 text-center">
          <div class="w-16 h-16 border-4 border-slate-200 border-t-blue-700 rounded-full animate-spin mx-auto mb-6"></div>
          <h2 class="text-2xl font-bold text-slate-900 mb-2">Analyse IA en cours...</h2>
          <p class="text-slate-500">Le Coach Cyber évalue vos vulnérabilités de manière sécurisée.</p>
        </div>

        <div v-if="result" class="animate-fade-in py-10">
          
          <div class="mb-12 text-center">
            <h2 class="text-4xl font-black text-slate-900 mb-8 tracking-tight">Votre Rapport d'Audit Cyber</h2>
            <div class="inline-flex flex-wrap items-center justify-center gap-10 bg-white border border-slate-200 shadow-2xl px-12 py-8 rounded-[2.5rem]">
              <div class="text-left md:border-r md:border-slate-100 md:pr-10">
                <p class="text-slate-400 font-bold uppercase tracking-widest text-[10px] mb-2">Score de vulnérabilité</p>
                <p class="text-6xl font-black text-blue-700 flex items-baseline gap-2">
                  {{ result.score }} <span class="text-2xl text-slate-200 font-medium">/ {{ result.maxScore }}</span>
                </p>
              </div>
              <div class="flex flex-col items-center">
                <div v-if="result.score / result.maxScore < 0.33" class="bg-emerald-50 text-emerald-600 ring-1 ring-emerald-200 px-6 py-2 rounded-full text-xs font-black uppercase tracking-widest">Risque Faible</div>
                <div v-else-if="result.score / result.maxScore < 0.66" class="bg-amber-50 text-amber-600 ring-1 ring-amber-200 px-6 py-2 rounded-full text-xs font-black uppercase tracking-widest">Risque Modéré</div>
                <div v-else class="bg-rose-50 text-rose-600 ring-1 ring-rose-200 px-6 py-2 rounded-full text-xs font-black uppercase tracking-widest">Risque Critique</div>
              </div>
            </div>
          </div>

          <!-- Carte Unique IA avec Graphique Emboîté -->
          <div class="bg-slate-900 p-8 md:p-14 rounded-[3rem] text-white shadow-2xl relative overflow-hidden border border-slate-800">
            <div class="absolute -top-10 -right-10 p-20 text-9xl opacity-5 select-none pointer-events-none">🤖</div>
            
            <h3 class="text-2xl md:text-3xl font-black text-blue-400 mb-10 flex items-center gap-4">
              <span class="bg-blue-600 text-white p-3 rounded-2xl shadow-lg shadow-blue-900/50 text-2xl">🤖</span> 
              L'Analyse de votre Coach Cyber
            </h3>

            <div class="relative z-10">
              <!-- Carte Graphique Radar (Floated à droite - Format Paysage) -->
              <div class="float-none md:float-right md:ml-10 mb-10 bg-white p-4 md:p-6 rounded-[2rem] w-full md:w-[500px] shadow-2xl border border-white">
                <h4 class="text-slate-900 font-black text-center mb-4 text-[9px] uppercase tracking-[0.2em] border-b border-slate-50 pb-2">
                  Cartographie des risques
                </h4>
                <div class="h-[250px] w-full flex items-center justify-center">
                  <RadarChart :scores="result.details" />
                </div>
              </div>

              <!-- Texte de l'avis (s'enroule autour du graphique) -->
              <div 
                class="text-slate-300 leading-relaxed text-base md:text-[17px] text-justify"
                v-html="formattedAdvice(result.advice)"
              >
              </div>

              <!-- Bouton d'action en bas -->
              <div class="clear-both pt-12 border-t border-slate-800 mt-12 flex flex-col md:flex-row items-center justify-between gap-6">
                <p class="text-slate-500 text-sm font-medium italic">Analyse générée en temps réel par Intelligence Artificielle.</p>
                <button @click="reset" class="w-full md:w-auto px-10 bg-blue-700 hover:bg-blue-600 text-white font-black py-4 rounded-2xl transition-all shadow-xl hover:shadow-blue-900/40 flex items-center justify-center gap-3 group">
                  <span>Recommencer l'audit</span>
                  <span class="transition-transform group-hover:translate-x-1">→</span>
                </button>
              </div>
            </div>
          </div>
        </div>

      </div>
    </main>

    <footer class="fixed bottom-0 left-0 w-full z-[100]">
      <div v-if="!ollamaReady" class="bg-amber-500 text-white text-[11px] py-1.5 px-6 flex items-center justify-between shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.1)]">
        <div class="flex items-center gap-3">
          <div class="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
          <span class="font-medium">Initialisation du Coach Cyber (IA)... Démarrage en cours.</span>
        </div>
        <span class="font-mono font-bold tracking-widest">OLLAMA: LOADING</span>
      </div>
      <div v-else class="bg-emerald-600 text-white text-[11px] py-1.5 px-6 flex items-center justify-between shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.1)]">
        <div class="flex items-center gap-3">
          <span class="font-medium">✅ Coach Cyber opérationnel. Prêt pour l'analyse.</span>
        </div>
        <span class="font-mono font-bold tracking-widest">OLLAMA: READY</span>
      </div>
    </footer>
  </div>
</template>