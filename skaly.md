## Wstęp

Piaskowiec magurski tworzy potężne, kilkuset-metrowe serie w płaszczowinie magurskiej Karpat fliszowych i powstał w paleocenie–eocenie w wyniku akumulacji głębokowodnych prądów zawiesinowych (turbidytów) przy krawędzi dawnego kontynentu. Skała składa się w 60–80 % z dobrze obtoczonych ziaren kwarcu z domieszką plagioklazu, fragmentów skał wulkanicznych i metamorficznych oraz spoiwa krzemionkowo-węglanowego, co przekłada się na wysoką wytrzymałość.

## Opis działania skryptu

Analizę rozpoczęto od wyczyszczenia sesji MATLAB-a, wczytania ośmiu zdjęć cienkiej płytki (jednego wykonanego w świetle spolaryzowanym i siedmiu w skrzyżowanych nikolach co trzydzieści stopni) oraz dodatkowej fotografii ze skalą długości 50 µm. Do dalszej pracy wybrano obraz w domyślnej pozycji (00).

### Kwarc  
W skrzyżowanych nikolach kwarc objawia się jasnoszarą barwą: trzy kanały RGB mają zbliżone wartości, a średnia jasność jest wyższa od tła. Na zdjęciu z jednym polaryzatorem minerał jest po prostu jasny i przekracza przyjęte progi na wszystkich kanałach. Połączenie obu masek redukuje liczbę fałszywych trafień; następnie kaskada filtrów medianowych, filtrów Wienera i operacji morfologicznych wygładza kontury oraz usuwa drobny szum, pozostawiając zwarte pola kwarcu.

### Glaukonit  
Do wykrywania glaukonitu użyto zdjęcia w świetle spolaryzowanym, na którym minerał ten jest intensywnie zielony. Warunek progowy wymaga dominacji kanału zielonego nad czerwonym oraz wyraźnej przewagi zielonego nad niebieskim. Po wstępnym odszumieniu liczne filtracje i erozje scalają rozproszone piksele w zwarte kształty, odrzucając obiekty mniejsze niż 10 000 px².

### Węglany  
Węglany rozpoznano na zdjęciu w skrzyżowanych nikolach, ponieważ przy tych ustawieniach kryształy węglanowe wykazują jaskrawe barwy interferencyjne. Piksel uznano za węglanowy tylko wtedy, gdy był bardzo jasny, a różnica między najjaśniejszym a najciemniejszym kanałem przekraczała ustalony próg — typowy wskaźnik silnego nasycenia barw. Po filtracji i usunięciu małych obiektów uzyskano trzecią maskę fazową.

### Inne  
Wszystkie piksele niespełniające powyższych kryteriów trafiły do kategorii „inne”. Skrypt zbudował czterokanałową mapę faz, przypisując kolory: zielony – glaukonit, szary – kwarc, **czerwony – węglany**, czarny – inne.

## Powierzchnia

Znając kalibrację obrazu (50 µm odpowiada 178 px), skrypt wyznaczył powierzchnię jednego piksela w milimetrach kwadratowych. Następnie zliczył piksele każdej fazy, przeliczył je na mm² i obliczył procentowy udział w całkowitej powierzchni próbki.

## Wyniki

![Cienka płytka w świetle spolaryzowanym — 1 N 00](1N_00.jpg)
*Rys. 1. Obraz przy jednym nikolu. Kwarc jest jasny, glaukonit wykazuje zielone odcienie, natomiast węglany nie wyróżniają się jeszcze interferencyjnymi barwami.*

![Cienka płytka w skrzyżowanych nikolach — XN 00](XN_00.jpg)
*Rys. 2. Ta sama płytka w skrzyżowanych nikolach. Kwarc przyjmuje jasnoszare tony, węglany ukazują się jako jaskrawo zabarwione plamy interferencyjne, a glaukonit ciemnieje.*

Mapa występowania minerałów wraz z legendą:  
- **glaukonit** – zielony  
- **kwarc** – szary  
- **węglany** – czerwony  
- **inne** – czarny  

![Wynikowa mapa faz mineralnych](wyniki.jpg)
*Rys. 3. Zintegrowana mapa fazowa wygenerowana przez skrypt; kolory odpowiadają legendzie powyżej.*

| Faza mineralna | Udział powierzchni [%] | Powierzchnia [mm²] |
| -------------- | ---------------------- | ------------------ |
| Glaukonit      | **11.43**              | **0.0286**         |
| Kwarc          | **61.31**              | **0.1533**         |
| Węglany        | **7.02**               | **0.0175**         |
| Inne           | **20.24**              | **0.0506**         |

Największą część powierzchni (ponad 60 %) zajmuje kwarc, co odpowiada typowej litologii piaskowców magurskich. Glaukonit stanowi około 11 %, występując w punktowych agregatach, a węglany obejmują 7 % powierzchni w postaci niewielkich, intensywnie zabarwionych obszarów interferencyjnych.  

Około 20 % pikseli trafiło do klasy **„inne”**. Mimo wielokrotnych filtracji i dopracowywania progów barwnych nie udało się jednoznacznie przypisać tej części do którejś z trzech głównych faz. Przyczyną mogą być nakładanie się barw interferencyjnych w mieszaninie drobnych ziaren, mikrospękania oraz pory żywicy w preparacie lub drobne zanieczyszczenia, które nie spełniały przyjętych kryteriów klasyfikacyjnych.


Mikolaj Szuba 416432