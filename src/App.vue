<template>
  <div class="min-h-screen flex flex-col">
    <section class="bg-gradient-to-r from-indigo-600 to-purple-700 text-white py-16 md:py-20 text-center rounded-b-lg shadow-lg">
      <div class="container mx-auto px-4">
        <h1 class="text-4xl md:text-5xl font-extrabold leading-tight mb-4 font-space-grotesk tracking-tight">
          The Email Polite-ifier
        </h1>
        <p class="text-lg md:text-xl max-w-2xl mx-auto opacity-90 font-light">
          Transform your aggressive drafts into diplomatic, professional masterpieces.
        </p>
      </div>
    </section>

    <main class="flex-grow container mx-auto px-4 py-12">
      
      <div class="bg-white p-6 rounded-xl shadow-md mb-8 flex flex-col md:flex-row justify-center items-center gap-6 border border-gray-100">
        <div class="flex items-center space-x-3 w-full md:w-auto">
          <label class="text-sm font-semibold text-gray-700"><i class="fas fa-sliders-h text-indigo-500 mr-2"></i>Tone:</label>
          <select v-model="selectedTone" class="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 block p-2.5 outline-none transition-all w-full md:w-48">
            <option value="professional">Professional</option>
            <option value="casual">Casual-Polite</option>
            <option value="direct">Short/Direct</option>
          </select>
        </div>

        <div class="flex items-center space-x-3 w-full md:w-auto">
          <label class="text-sm font-semibold text-gray-700"><i class="fas fa-microchip text-indigo-500 mr-2"></i>AI Engine:</label>
          <div class="flex space-x-2 bg-gray-100 p-1 rounded-lg w-full md:w-auto">
            <button 
              @click="aiProvider = 'gemini'"
              :class="['px-4 py-2 text-sm rounded-md transition-all duration-300 flex-1 md:flex-none', aiProvider === 'gemini' ? 'bg-white shadow-sm font-semibold text-indigo-700' : 'text-gray-500 hover:text-gray-700']"
            >
              Gemini 2.5 Flash
            </button>
            <button 
              @click="aiProvider = 'huggingface'"
              :class="['px-4 py-2 text-sm rounded-md transition-all duration-300 flex-1 md:flex-none', aiProvider === 'huggingface' ? 'bg-white shadow-sm font-semibold text-indigo-700' : 'text-gray-500 hover:text-gray-700']"
            >
              Hugging Face
            </button>
          </div>
        </div>
      </div>

      <div v-if="errorMessage" class="mb-8 bg-red-50 border-l-4 border-red-500 p-4 rounded-r-lg shadow-sm">
        <p class="text-red-700 font-medium"><i class="fas fa-exclamation-circle mr-2"></i>{{ errorMessage }}</p>
      </div>

      <div class="grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        <div class="bg-white p-6 rounded-xl shadow-lg hover:shadow-xl transition-shadow duration-300 flex flex-col h-[500px] border border-gray-100">
          <h3 class="text-2xl font-semibold text-gray-800 mb-4 font-space-grotesk flex items-center">
            <div class="text-red-500 mr-3"><i class="fas fa-fire-alt"></i></div>
            The Vent Box
          </h3>
          <textarea 
            v-model="inputText" 
            placeholder="Type your unfiltered, frustrated email here..."
            class="w-full flex-grow p-4 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none resize-none transition-all font-inter text-gray-700"
          ></textarea>
        </div>

        <div class="bg-white p-6 rounded-xl shadow-lg hover:shadow-xl transition-shadow duration-300 flex flex-col h-[500px] border border-gray-100 relative">
          <div class="flex justify-between items-center mb-4">
            <h3 class="text-2xl font-semibold text-gray-800 font-space-grotesk flex items-center">
              <div class="text-green-500 mr-3"><i class="fas fa-magic"></i></div>
              The Polished Result
            </h3>
            <button 
              @click="copyToClipboard" 
              :disabled="!outputText"
              class="text-indigo-600 hover:text-indigo-800 font-semibold disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <i :class="copied ? 'fas fa-check' : 'fas fa-copy'"></i> {{ copied ? 'Copied!' : 'Copy' }}
            </button>
          </div>
          
          <div class="relative flex-grow">
            <textarea 
              v-model="outputText" 
              readonly
              placeholder="Your professional, polite email will appear here..."
              class="w-full h-full p-4 bg-gray-50 border border-gray-200 rounded-lg outline-none resize-none text-gray-700 font-inter"
            ></textarea>
            
            <div v-if="isLoading" class="absolute inset-0 bg-white/90 backdrop-blur-sm flex items-center justify-center rounded-lg border border-gray-100 z-10">
              <div class="flex flex-col items-center">
                <i class="fas fa-circle-notch fa-spin text-4xl text-indigo-600 mb-4"></i>
                <p class="text-lg font-semibold text-indigo-600 font-space-grotesk animate-pulse">Processing via {{ aiProvider === 'gemini' ? 'Gemini...' : 'Hugging Face...' }}</p>
              </div>
            </div>
          </div>
        </div>

      </div>

      <div class="flex justify-center mt-12">
        <button 
          @click="handleProcessEmail" 
          :disabled="isLoading || !inputText"
          class="bg-indigo-600 text-white px-10 py-4 rounded-full font-bold text-lg hover:bg-indigo-700 transition-all duration-300 shadow-lg transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none disabled:hover:shadow-lg flex items-center"
        >
          <i class="fas fa-paper-plane mr-3"></i> Polite-ify Email
        </button>
      </div>

    </main>
    
    <footer class="bg-gray-800 text-white py-8 mt-auto rounded-t-lg shadow-inner text-center">
      <h3 class="text-xl font-bold text-indigo-300 font-space-grotesk mb-2">Hizaki Labs</h3>
      <p class="text-gray-400 text-sm">Innovation & Expertise</p>
    </footer>
  </div>
</template>

<script setup>
import { ref } from 'vue';
import { processEmail } from './services/aiService';

const inputText = ref('');
const outputText = ref('');
const selectedTone = ref('professional');
const aiProvider = ref('gemini'); // Defaulting to the new Gemini setup
const isLoading = ref(false);
const errorMessage = ref('');
const copied = ref(false);

const handleProcessEmail = async () => {
  errorMessage.value = '';
  outputText.value = '';
  isLoading.value = true;

  try {
    outputText.value = await processEmail(inputText.value, selectedTone.value, aiProvider.value);
  } catch (error) {
    errorMessage.value = error.message || "An unexpected error occurred.";
  } finally {
    isLoading.value = false;
  }
};

const copyToClipboard = async () => {
  if (!outputText.value) return;
  try {
    await navigator.clipboard.writeText(outputText.value);
    copied.value = true;
    setTimeout(() => copied.value = false, 2000);
  } catch (err) {
    errorMessage.value = "Failed to copy to clipboard.";
  }
};
</script>