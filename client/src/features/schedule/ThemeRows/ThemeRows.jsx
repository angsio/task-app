import { List } from '../../../components'
import { ThemeCard } from './ThemeCard'

const styles = {
    container: 'bg-obsidian',
}

export const ThemeRows = ({ themes }) => {
    return (
        <div className={`h-2/5 w-full ${styles.container}`}>
            <List
                items={themes}
                keyExtractor={theme => theme._id}
                visible={{ base: 3, md: 4, lg: 5 }}
                className="h-full w-full overflow-y-auto scrollbar-none"
            >
                {theme => <ThemeCard theme={theme} />}
            </List>
        </div>
    )
}