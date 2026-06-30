import useFetch from './hooks/useFetch'
import List from './components/List'

const App = () => {
  const { data, loading, error } = useFetch('http://localhost:5000/api/data')

  if (loading) return <p>Loading...</p>
  if (error) return <p>Error: {error.message}</p>

  return (
    <div className="min-h-screen flex items-center justify-center text-black">
      <div className="p-8 text-center">
        <List
          items={data}
          fallback={<p>No tasks.</p>}
          keyExtractor={item => item._id}
        >
          {(item, key) => (
            <div key={key}>
              {item.name}
            </div>
          )}
        </List>
      </div>
    </div>
  )
}

export default App