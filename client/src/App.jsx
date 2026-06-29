import { useState, useEffect } from 'react'

import useFetch from './hooks/useFetch'

const App = () => {
  const { data, loading, error } = useFetch('http://localhost:5000/api/pulse')

  return (
    <div className="min-h-screen flex items-center justify-center text-black">
      <div className="p-8 text-center">
        {data && <p>{data.status}</p>}
        {loading && <p>Loading...</p>}
        {error && <p>{error.message}</p>}
      </div>
    </div>
  )
}

export default App
