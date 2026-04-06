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

export const ThemeProvider = ({
    children,
    defaultTheme = 'dark',
    storageKey = 'okay-vote-theme',
}: ThemeProviderProps): ReactElement => {
    const [theme, setTheme] = useState<Theme>(
        () => (localStorage.getItem(storageKey) as Theme) || defaultTheme,
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
                    localStorage.setItem(storageKey, nextTheme);
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
