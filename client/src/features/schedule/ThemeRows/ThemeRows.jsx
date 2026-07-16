import { List } from '../../../components'
import { ThemeCard } from './ThemeCard'

export const ThemeRows = ({ themes }) => {
    return (
        <div className="h-2/5 w-full bg-sky-200">
            <List
                items={themes}
                keyExtractor={theme => theme._id}
                flow="x"
                slots={1}
                autoSize="20%"
                className="h-full w-full overflow-y-auto scrollbar-none bg-blue-600"
                itemClassName=""
            >
                {theme => <ThemeCard theme={theme} />}
            </List>
        </div>
    )
}