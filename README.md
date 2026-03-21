# Projekt: Moduł Komentarzy

Ten projekt to niezależny moduł komentarzy, który można podłączać do innych projektów.

## Główne założenia
- Możliwość łatwej integracji z dowolną aplikacją Next.js.
- Pełna kontrola nad logiką serwerową poprzez przekazywane funkcje (decoupling).
- Obsługa komentarzy, odpowiedzi oraz polubień.
- Możliwość działania w trybie tylko do odczytu dla niezalogowanych użytkowników.

## Fazy Rozwoju
- **Faza 1: Ostateczne czyszczenie** - Usunięcie zbędnych plików z poprzednich projektów.
- **Faza 2: Rozłożenie struktury** - Przeniesienie plików komponentów, API i bazy danych do odpowiednich miejsc.
- **Faza 3: Dekapling i neutralizacja** - Odcięcie od specyficznych zależności (np. NextAuth) i uniezależnienie interfejsu od serwera.
- **Faza 4: Zamknięcie w moduł** - Utworzenie głównego punktu wejścia dla modułu.
