import { List } from '../../../components'
import { ThemeCard } from './ThemeCard'

const styles = {
    container: 'bg-sky-200',
    list:      'bg-blue-600',
}

export const ThemeRows = ({ themes }) => {
    return (
        <div className={`h-2/5 w-full ${styles.container}`}>
            <List
                items={themes}
                keyExtractor={theme => theme._id}
                flow="x"
                slots={1}
                autoSize="20%"
                className={`h-full w-full overflow-y-auto scrollbar-none ${styles.list}`}
                itemClassName=""
            >
                {theme => <ThemeCard theme={theme} />}
            </List>
        </div>
    )
}