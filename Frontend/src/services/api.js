import axios from 'axios'

const devApiBaseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000'

export const api = axios.create({
  // Em desenvolvimento, o frontend roda no Vite e fala com o backend local.
  // No build servido pelo Express, a API usa a mesma origem da pagina.
  baseURL: import.meta.env.DEV ? devApiBaseUrl : ''
})
