# Projekt: Moduł Komentarzy

Ten projekt to niezależny, wysoce odpięty (decoupled) moduł komentarzy, zaprojektowany z myślą o łatwej integracji z dowolną aplikacją Next.js. Głównym celem jest zapewnienie kompletnej sekcji komentarzy, która jest całkowicie agnostyczna względem systemów autoryzacji i konkretnych implementacji backendowych aplikacji nadrzędnej.

## Główne założenia i Inżynieria "Najs"
- **Absolutna neutralność autoryzacji:** Moduł nie posiada własnej logiki logowania (brak `auth.ts`, brak zależności od `NextAuth`). Tożsamość użytkownika jest przekazywana do API za pomocą zaufanego nagłówka HTTP `X-User-Id`.
- **Interfejs sterowany przez Props:** Komponenty frontendowe (`CommentsModule`, `EmbeddedComments`) nie odpytują stanu sesji. Formularze i akcje są dostępne tylko wtedy, gdy aplikacja nadrzędna wstrzyknie obiekt `userProfile`.
- **Uniwersalne API:** Logika interakcji (dodawanie komentarza, polubienie) może być nadpisana przez funkcje przekazywane w propsach, co uniezależnia interfejs od sztywnej struktury serwera.
- **Tryb Read-Only:** Jeśli dane użytkownika nie zostaną przekazane, moduł automatycznie przechodzi w tryb tylko do odczytu, ukrywając formularze dodawania treści.

## Co robimy?
W ramach tego projektu przekształcamy monalityczny system komentarzy w wysoce modularną i uniwersalną bibliotekę. Głównym zadaniem było odcięcie wszystkich twardych zależności od specyficznych technologii (takich jak NextAuth) i zastąpienie ich elastycznym interfejsem opartym na propsach oraz nagłówkach HTTP. Dzięki temu moduł komentarzy może być łatwo przenoszony między różnymi projektami, zachowując pełną funkcjonalność przy minimalnej konfiguracji.

## Architektura Bazy Danych
Projekt wykorzystuje **Prisma ORM** do zarządzania strukturą danych. Schemat (`prisma/schema.prisma`) definiuje następujące modele:
- `Comment`: Przechowuje treść komentarza, link do slajdu/materiału (`slideId`) oraz obsługuje rekurencyjne odpowiedzi (`parentId`).
- `CommentLike`: Zarządza polubieniami komentarzy przez użytkowników.
- `User` i `Slide`: Relacje niezbędne do zachowania integralności danych wewnątrz modułu.

Baza danych jest zoptymalizowana pod kątem wydajnego pobierania wątków komentarzy oraz szybkich operacji polubień dzięki odpowiednim indeksom na polach `slideId` oraz `parentId`.

## Fazy Rozwoju
- **Faza 1: Ostateczne czyszczenie** - Usunięcie artefaktów z poprzednich projektów i przygotowanie czystego środowiska frameworka.
- **Faza 2: Rozłożenie struktury** - Migracja logiki do dedykowanych katalogów `components/comments`, `app/api/comments` oraz `prisma/`.
- **Faza 3: Dekapling i neutralizacja** - Całkowite odcięcie od lokalnych systemów auth, wprowadzenie komunikacji opartej na nagłówkach i wstrzykiwanych propsach.
- **Faza 4: Zamknięcie w moduł** - Utworzenie punktu wejścia `CommentsModule` i konfiguracja `package.json` pod kątem eksportu jako niezależna paczka.
