import {
    createContext,
    useContext,
    useEffect,
    useState,
    type ReactElement,
    type ReactNode,
} from 'react';

type Theme = 'dark' | 'light' | 'system';

type ThemeProviderState = {
    theme: Theme;
    setTheme: (theme: Theme) => void;
};

type ThemeProviderProps = {
    children: ReactNode;
    defaultTheme?: Theme;
    storageKey?: string;
};

const ThemeProviderContext = createContext<ThemeProviderState>({
    theme: 'dark',
    setTheme: () => undefined,
});

const validThemes: Theme[] = ['dark', 'light', 'system'];

const isTheme = (value: string | null): value is Theme =>
    value !== null && validThemes.includes(value as Theme);

const getInitialTheme = (storageKey: string, defaultTheme: Theme): Theme => {
    if (typeof window === 'undefined') {
        return defaultTheme;
    }

    try {
        const storedTheme = window.localStorage.getItem(storageKey);

        return isTheme(storedTheme) ? storedTheme : defaultTheme;
    } catch {
        return defaultTheme;
    }
};

export const ThemeProvider = ({
    children,
    defaultTheme = 'dark',
    storageKey = 'okay-vote-theme',
}: ThemeProviderProps): ReactElement => {
    const [theme, setTheme] = useState<Theme>(() =>
        getInitialTheme(storageKey, defaultTheme),
    );

    useEffect(() => {
        const root = window.document.documentElement;
        const resolvedTheme =
            theme === 'system'
                ? window.matchMedia('(prefers-color-scheme: dark)').matches
                    ? 'dark'
                    : 'light'
                : theme;

        root.classList.remove('light', 'dark');
        root.classList.add(resolvedTheme);
    }, [theme]);

    return (
        <ThemeProviderContext.Provider
            value={{
                theme,
                setTheme: (nextTheme: Theme) => {
                    try {
                        window.localStorage.setItem(storageKey, nextTheme);
                    } catch {
                        // Ignore storage failures and keep the in-memory theme.
                    }
                    setTheme(nextTheme);
                },
            }}
        >
            {children}
        </ThemeProviderContext.Provider>
    );
};

export const useTheme = (): ThemeProviderState =>
    useContext(ThemeProviderContext);

export default ThemeProvider;
