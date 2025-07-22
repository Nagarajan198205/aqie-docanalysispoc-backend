import OpenAI from 'openai'
import { PromptTemplate } from 'langchain/prompts'
import { StringOutputParser } from 'langchain/schema/output_parser'
import { config } from '../config.js'
import { createLogger } from '../common/helpers/logging/logger.js'

const logger = createLogger()

export async function summarizeText(text) {
  try {
    const apiKey = config.get('openai.apiKey')
    if (!apiKey) {
      throw new Error('OpenAI API key is not configured')
    }

    // Initialize the OpenAI model
    const model = new OpenAI({
      modelName: config.get('openai.model') || 'gpt-3.5-turbo-instruct',
      openAIApiKey: apiKey,
      temperature: 0.3
    })

    // Create a prompt template for summarization
    const promptTemplate = PromptTemplate.fromTemplate(
      'Summarize the following document in a concise way, highlighting the key points:\n\n{text}'
    )

    // Create a chain for processing 
    const chain = promptTemplate.pipe(model).pipe(new StringOutputParser())

    // Execute the chain with the text
    const summary = await chain.invoke({ text })

    return summary
  } catch (error) {
    logger.error(`Error summarizing text: ${error.message}`)
    throw new Error(`Failed to summarize text: ${error.message}`)
  }
}

/**
 * Summarize text using Azure OpenAI
 * @param {string} text - Text to summarize
 * @returns {Promise<string>} - Summarized text
 */
export async function summarizeTextWithAzure(text) {
  try {
    const apiKey = config.get('openai.apiKey')
    const apiUrl = config.get('openai.apiUrl')
    const model = config.get('openai.model') || 'gpt-4'
    
    if (!apiKey) {
      throw new Error('OpenAI API key is not configured')
    }

    // Import OpenAI dynamically to avoid issues with ESM/CJS
    const { default: OpenAIApi } = await import('openai')

    // Initialize the OpenAI client with Azure configuration
    const openai = new OpenAIApi({
      apiKey: apiKey,
      baseURL: `${apiUrl}openai/deployments/${model}`,
      defaultQuery: { 'api-version': '2023-07-01-preview' },
      defaultHeaders: { 'api-key': apiKey }
    })
    
    // Create completion using the OpenAI client
    const completion = await openai.chat.completions.create({
      messages: [
        {
          role: 'system',
          content: 'You are an assistant that summarizes policy documents.'
        },
        { 
          role: 'user', 
          content: `Summarize the following document in a concise way, highlighting the key points:\n\n${text}` 
        }
      ],
      model: model,
      temperature: 0.7,
      max_tokens: 4000
    })
    
    return completion.choices[0].message.content
  } catch (error) {
    logger.error(`Error summarizing text with Azure: ${error.message}`)
    throw new Error(`Failed to summarize text with Azure: ${error.message}`)
  }
}