import React, { useEffect, useState } from 'react'
import { SyncAltIcon } from '@patternfly/react-icons'
import { Dropdown, DropdownItem, DropdownToggle } from '@patternfly/react-core'
import { makeStyles } from '@material-ui/styles'

const DEFAULT_REFRESH_TIME = 30
const REFRESH_VALUES = [30, 60, 5 * 60, 30 * 60, 0]
const OVERVIEW_REFRESH_INTERVAL_COOKIE = 'acm-overview-interval-refresh-cookie'

export type AcmAutoRefreshSelectProps = {
    refetch: () => void
    pollInterval: number
}

const useStyles = makeStyles({
    container: {
        display: 'flex',
        alignItems: 'center',
        maxWidth: '225px',
    },
    reloadButton: {
        cursor: 'pointer',
    },
    buttonTitle: {
        maxWidth: '200px',
        '& button': {
            '& span': {
                fontSize: 'var(--pf-global--FontSize--sm)',
                color: 'var(--pf-global--primary-color--100)',
            },
            '&:hover, &:focus': {
                '& span': {
                    color: 'var(--pf-global--primary-color--200)',
                },
            },
        },
    },
    icon: {
        maxWidth: '25px',
        color: 'var(--pf-global--primary-color--100)',
    },
})

export const getPollInterval = (OVERVIEW_REFRESH_INTERVAL_COOKIE: string) => {
    let pollInterval = DEFAULT_REFRESH_TIME * 1000
    if (OVERVIEW_REFRESH_INTERVAL_COOKIE) {
        const savedInterval = localStorage.getItem(OVERVIEW_REFRESH_INTERVAL_COOKIE)
        if (savedInterval) {
            try {
                const saved = JSON.parse(savedInterval)
                if (saved.pollInterval !== undefined) {
                    pollInterval = saved.pollInterval
                }
            } catch (e) {
                //
            }
        } else {
            savePollInterval(OVERVIEW_REFRESH_INTERVAL_COOKIE, pollInterval)
        }
    }
    return pollInterval
}

export const savePollInterval = (OVERVIEW_REFRESH_INTERVAL_COOKIE: string, pollInterval: number) => {
    localStorage.setItem(OVERVIEW_REFRESH_INTERVAL_COOKIE, JSON.stringify({ pollInterval }))
}

const useLocalStorage = (key: string, initialValue: number) => {
    const [storedValue, setStoredValue] = useState(() => {
        try {
            const item = window.localStorage.getItem(key)
            return item ? JSON.parse(item) : initialValue
        } catch (error) {
            console.log(error)
            return initialValue
        }
    })
    const setValue = (value: Record<number, unknown>) => {
        try {
            const valueToStore = value instanceof Function ? value(storedValue) : value
            setStoredValue(valueToStore)
            window.localStorage.setItem(key, JSON.stringify(valueToStore))
        } catch (error) {
            console.log(error)
        }
    }
    return [storedValue, setValue]
}

export function AcmAutoRefreshSelect(props: AcmAutoRefreshSelectProps) {
    const [isOpen, setOpen] = useState<boolean>(false)
    const [selected, setSelected] = useLocalStorage('pollInterval', 30000)
    const [addedListener, setAddedListener] = useState<boolean>(false)
    const [docHidden, setDocHidden] = useState<boolean>(false)
    const onVisibilityChange = () => {
        setDocHidden(window.document.hidden)
    }
    if (!addedListener) {
        document.addEventListener('visibilitychange', onVisibilityChange)
        setAddedListener(true)
    }

    const [pollInterval, setPollInterval] = useState(props.pollInterval)
    const classes = useStyles()
    const { refetch } = props

    useEffect(() => {
        refetch()
        setPollInterval(selected.pollInterval)
        savePollInterval(OVERVIEW_REFRESH_INTERVAL_COOKIE, selected.pollInterval)
        if (!docHidden && selected.pollInterval !== 0) {
            const interval = setInterval(() => {
                refetch()
            }, selected.pollInterval)
            return () => {
                document.removeEventListener('visibilitychange', onVisibilityChange)
                setAddedListener(false)
                clearInterval(interval)
            }
        }
    }, [selected, docHidden])

    const handleRefresh = () => {
        refetch()
    }

    const handleKeyPress = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') {
            refetch()
        }
    }

    const autoRefreshChoices = REFRESH_VALUES.map((pollInterval) => {
        let id, text
        if (pollInterval >= 60) {
            id = `refresh-${pollInterval / 60}m`
            text = `Refresh every ${pollInterval / 60}m`
        } else if (pollInterval !== 0) {
            id = `refresh-${pollInterval}s`
            text = `Refresh every ${pollInterval}s`
        } else {
            id = 'refresh-disable'
            text = 'Disable refresh'
        }
        pollInterval *= 1000
        return { id, text, pollInterval }
    })

    return (
        <div className={classes.container}>
            <div
                className={classes.reloadButton}
                tabIndex={0}
                role={'button'}
                onClick={handleRefresh}
                onKeyPress={handleKeyPress}
            >
                <SyncAltIcon className={classes.icon} />
            </div>
            <Dropdown
                className={classes.buttonTitle}
                id="refresh-dropdown"
                onSelect={() => setOpen(!isOpen)}
                isOpen={isOpen}
                isPlain
                toggle={
                    <DropdownToggle id="refresh-toggle" isDisabled={false} onToggle={() => setOpen(!isOpen)}>
                        {selected.text}
                    </DropdownToggle>
                }
                dropdownItems={autoRefreshChoices.map((item) => (
                    <DropdownItem key={item.id} {...item} onClick={() => setSelected(item)}>
                        {item.text}
                    </DropdownItem>
                ))}
            />
        </div>
    )
}