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
                flow="x"
                slots={1}
                autoSize={{ base: '33.333%', md: '25%', lg: '20%' }}
                className="h-full w-full overflow-y-auto scrollbar-none"
                itemClassName=""
            >
                {theme => <ThemeCard theme={theme} />}
            </List>
        </div>
    )
}