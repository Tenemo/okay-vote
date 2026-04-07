import {
    useCallback,
    createContext,
    useContext,
    useEffect,
    useMemo,
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

const resolveSystemTheme = (): 'dark' | 'light' =>
    window.matchMedia('(prefers-color-scheme: dark)').matches
        ? 'dark'
        : 'light';

const applyThemeClass = (theme: Theme): void => {
    const root = window.document.documentElement;
    const resolvedTheme = theme === 'system' ? resolveSystemTheme() : theme;

    root.classList.remove('light', 'dark');
    root.classList.add(resolvedTheme);
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
        applyThemeClass(theme);

        if (theme !== 'system') {
            return undefined;
        }

        const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
        const handleChange = (): void => {
            applyThemeClass('system');
        };

        mediaQuery.addEventListener('change', handleChange);

        return () => {
            mediaQuery.removeEventListener('change', handleChange);
        };
    }, [theme]);

    const persistTheme = useCallback(
        (nextTheme: Theme): void => {
            try {
                window.localStorage.setItem(storageKey, nextTheme);
            } catch {
                // Ignore storage failures and keep the in-memory theme.
            }
            setTheme(nextTheme);
        },
        [storageKey],
    );

    const value = useMemo(
        () => ({
            theme,
            setTheme: persistTheme,
        }),
        [persistTheme, theme],
    );

    return (
        <ThemeProviderContext.Provider value={value}>
            {children}
        </ThemeProviderContext.Provider>
    );
};

export const useTheme = (): ThemeProviderState =>
    useContext(ThemeProviderContext);

export default ThemeProvider;
