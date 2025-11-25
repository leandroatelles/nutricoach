
import { GoogleGenAI, Type, Schema } from "@google/genai";
import { AIPlanResponse, UserProfile } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

const planSchema: Schema = {
  type: Type.OBJECT,
  properties: {
    nutritionStrategy: { type: Type.STRING, description: "Resumo da estratégia nutricional." },
    workoutStrategy: { type: Type.STRING, description: "Resumo da metodologia de treino." },
    dailyMacros: {
      type: Type.OBJECT,
      properties: {
        protein: { type: Type.NUMBER, description: "Gramas de proteína" },
        carbs: { type: Type.NUMBER, description: "Gramas de carboidratos" },
        fats: { type: Type.NUMBER, description: "Gramas de gorduras" },
        calories: { type: Type.NUMBER, description: "Calorias totais" },
      },
      required: ["protein", "carbs", "fats", "calories"],
    },
    mealPlan: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          name: { type: Type.STRING },
          time: { type: Type.STRING },
          ingredients: { type: Type.ARRAY, items: { type: Type.STRING } },
          instructions: { type: Type.STRING },
          macros: {
            type: Type.OBJECT,
            properties: {
              protein: { type: Type.NUMBER },
              carbs: { type: Type.NUMBER },
              fats: { type: Type.NUMBER },
              calories: { type: Type.NUMBER },
            }
          }
        },
        required: ["name", "ingredients"],
      },
    },
    workoutPlan: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          day: { type: Type.STRING },
          focus: { type: Type.STRING },
          exercises: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                name: { type: Type.STRING },
                sets: { type: Type.NUMBER },
                reps: { type: Type.STRING },
                notes: { type: Type.STRING },
              },
              required: ["name", "sets", "reps"],
            },
          },
        },
        required: ["day", "focus", "exercises"],
      },
    },
    supplementRecommendations: {
      type: Type.ARRAY,
      items: { type: Type.STRING },
    },
  },
  required: ["nutritionStrategy", "workoutStrategy", "dailyMacros", "mealPlan", "workoutPlan", "supplementRecommendations"],
};

export const refineUserText = async (text: string, context: string): Promise<string> => {
  try {
    const prompt = `
      Você é um assistente pessoal inteligente. Melhore o seguinte texto fornecido pelo usuário para um aplicativo de nutrição/treino.
      Contexto do campo: ${context}.
      
      Texto original: "${text}"

      Instruções:
      1. Corrija erros gramaticais.
      2. Torne o texto mais claro e profissional, mas mantenha a essência da informação.
      3. Organize em tópicos se houver muita informação misturada.
      4. Mantenha em Português do Brasil.
      5. Responda APENAS com o texto melhorado, sem introduções.
    `;

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
    });

    return response.text?.trim() || text;
  } catch (error) {
    console.error("Error refining text:", error);
    return text; // Fallback to original text
  }
};

export const generatePersonalizedPlan = async (profile: UserProfile): Promise<AIPlanResponse> => {
  try {
    let measurementsText = "Não informado";
    if (profile.measurements) {
        const m = profile.measurements;
        measurementsText = `
          - Pescoço: ${m.neck || '-'} cm
          - Ombros: ${m.shoulders || '-'} cm
          - Peitoral: ${m.chest || '-'} cm
          - Braços: ${m.arms || '-'} cm
          - Cintura: ${m.waist || '-'} cm
          - Quadril: ${m.hips || '-'} cm
          - Coxas: ${m.thigh || '-'} cm
          - Panturrilhas: ${m.calf || '-'} cm
        `;
    }

    const prompt = `
      Atue como um Nutricionista e Treinador Físico de classe mundial (Personal Trainer).
      Crie um plano de nutrição e treino altamente personalizado com base nos seguintes dados de avaliação do cliente.
      
      IMPORTANTE: Responda inteiramente em Português do Brasil (PT-BR).

      Perfil do Cliente:
      - Nome: ${profile.name}
      - Idade: ${profile.age}
      - Gênero: ${profile.gender}
      - Altura: ${profile.height} cm
      - Peso Atual (Jejum): ${profile.currentWeight} kg
      - Objetivo: ${profile.goal}
      
      Medidas Corporais:
      ${measurementsText}

      Contexto:
      - Rotina Diária: ${profile.dailyRoutine}
      - Histórico/Dieta Atual: ${profile.currentDiet}
      - Preferências Alimentares (Gostos/Aversões): ${profile.foodPreferences}
      - Substituições Usuais: ${profile.foodSubstitutions}
      - Rotina de Treino Atual: ${profile.workoutRoutine}
      - Suplementação Atual: ${profile.supplementation}

      Requisitos Obrigatórios:
      1. **OPÇÕES NAS REFEIÇÕES**: Para cada refeição principal, forneça pelo menos 2 opções de escolha (ex: Opção A: Frango com batata... OU Opção B: Peixe com arroz...). Liste isso claramente no campo 'ingredients' ou 'instructions'.
      2. Crie um plano alimentar diário sustentável que se encaixe na rotina descrita.
      3. Crie uma divisão de treino semanal adaptada ao objetivo e status atual. Indique substituições possíveis nas notas dos exercícios.
      4. Sugira suplementos se necessário, considerando o que já tomam.
      5. Seja específico com quantidades (em gramas ou medidas caseiras).
    `;

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: planSchema,
        temperature: 0.5,
      },
    });

    if (response.text) {
      return JSON.parse(response.text) as AIPlanResponse;
    }
    throw new Error("No response from AI");
  } catch (error) {
    console.error("Error generating plan:", error);
    throw error;
  }
};