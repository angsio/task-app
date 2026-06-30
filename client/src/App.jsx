import useFetch from './hooks/useFetch'

const App = () => {
  const { data, loading, error } = useFetch('http://localhost:5000/api/data')

  if (loading) return <p>Loading...</p>
  if (error) return <p>Error: {error.message}</p>

  return (
    <div className="min-h-screen flex items-center justify-center text-black">
      <div className="p-8 text-center">
        {data && data.length > 0 ? (
          data.map(task => 
            <div key={task._id}>
              <p>Name: {task.name}</p>
            </div>
          )
        ) : (
          <p>No tasks.</p>
        )}
      </div>
    </div>
  )
}

export default App
