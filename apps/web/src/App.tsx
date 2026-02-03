import { useState } from "react";
import { CreditCard } from "./types/card";
import { mockCards } from "./data/mockCards";
import { HomeScreen } from "./components/HomeScreen";
import { CardsScreen } from "./components/CardsScreen";
import { CardDetailScreen } from "./components/CardDetailScreen";
import { AddCardScreen } from "./components/AddCardScreen";
import { ExplanationScreen } from "./components/ExplanationScreen";
import { SettingsScreen } from "./components/SettingsScreen";
import { BottomNav } from "./components/BottomNav";
import { ThemeProvider } from "./context/ThemeContext";
import { Strategy, StrategyModal } from "./components/StrategyModal";

type Screen =
  | "home"
  | "cards"
  | "cardDetail"
  | "addCard"
  | "explanation"
  | "settings";

export default function App() {
  const [activeTab, setActiveTab] = useState<"plan" | "cards" | "settings">(
    "plan"
  );
  const [currentScreen, setCurrentScreen] = useState<Screen>("home");
  const [selectedCardId, setSelectedCardId] = useState<string | null>(null);
  const [cards, setCards] = useState<CreditCard[]>(mockCards);
  const [strategy, setStrategy] = useState<Strategy>("utilization");
  const [showStrategyModal, setShowStrategyModal] = useState(false);

  const handleCardClick = (cardId: string) => {
    setSelectedCardId(cardId);
    setCurrentScreen("cardDetail");
  };

  const handleBackToHome = () => {
    setCurrentScreen("home");
    setSelectedCardId(null);
  };

  const handleBackToCards = () => {
    setCurrentScreen("cards");
    setSelectedCardId(null);
  };

  const handleSaveCard = (updatedCard: CreditCard) => {
    setCards(
      cards.map((card) => (card.id === updatedCard.id ? updatedCard : card))
    );
  };

  const handleAddCard = (newCard: CreditCard) => {
    setCards([...cards, newCard]);
  };

  const handleAddCardClick = () => {
    setCurrentScreen("addCard");
  };

  const handleTabChange = (tab: "plan" | "cards" | "settings") => {
    setActiveTab(tab);
    if (tab === "plan") {
      setCurrentScreen("home");
    } else if (tab === "cards") {
      setCurrentScreen("cards");
    } else if (tab === "settings") {
      setCurrentScreen("settings");
    }
    setSelectedCardId(null);
  };

  const handleExplanationClick = () => {
    setCurrentScreen("explanation");
  };

  const handleExplanationBack = () => {
    setCurrentScreen("home");
  };

  const handleCompareStrategies = () => {
    setShowStrategyModal(true);
  };

  const handleMarkPaid = (cardId: string, amount: number) => {
    setCards(
      cards.map((c) =>
        c.id === cardId ? { ...c, balance: Math.max(0, c.balance - amount) } : c
      )
    );
  };

  const handleDeleteCard = (cardId: string) => {
    setCards(cards.filter((c) => c.id !== cardId));
    setSelectedCardId(null);
    setCurrentScreen(activeTab === "cards" ? "cards" : "home");
  };

  const renderScreen = () => {
    switch (currentScreen) {
      case "home":
        return (
          <HomeScreen
            cards={cards}
            onCardClick={handleCardClick}
            onExplanationClick={handleExplanationClick}
            strategy={strategy}
            onOpenStrategyModal={() => setShowStrategyModal(true)}
            onMarkPaid={handleMarkPaid}
          />
        );
      case "cards":
        return (
          <CardsScreen
            cards={cards}
            onCardClick={handleCardClick}
            onAddCardClick={handleAddCardClick}
          />
        );
      case "addCard":
        return (
          <AddCardScreen onBack={handleBackToCards} onSave={handleAddCard} />
        );
      case "cardDetail":
        const selectedCard = cards.find((c) => c.id === selectedCardId);
        if (!selectedCard) return null;
        return (
          <CardDetailScreen
            card={selectedCard}
            onBack={
              activeTab === "cards" ? handleBackToCards : handleBackToHome
            }
            onSave={handleSaveCard}
            onDeleteCard={handleDeleteCard}
          />
        );
      case "explanation":
        return (
          <ExplanationScreen
            onBack={handleExplanationBack}
            currentStrategy={strategy}
            onCompareStrategies={handleCompareStrategies}
          />
        );
      case "settings":
        return <SettingsScreen />;
      default:
        return null;
    }
  };

  return (
    <ThemeProvider>
      <div className="min-h-screen bg-white dark:bg-[#1C1C1C]">
        {renderScreen()}
        <BottomNav activeTab={activeTab} onTabChange={handleTabChange} />
        {showStrategyModal && (
          <StrategyModal
            currentStrategy={strategy}
            onSelect={setStrategy}
            onClose={() => setShowStrategyModal(false)}
          />
        )}
      </div>
    </ThemeProvider>
  );
}
