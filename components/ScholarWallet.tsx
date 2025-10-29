import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { MarketplaceItem } from '../types';
import { ScholarCoinIcon, SparklesIcon, TargetIcon, BrushIcon, TicketIcon, CheckCircleIcon } from '../constants/icons';
import { View } from '../App';

interface ScholarWalletProps {
    setView: (view: View) => void;
    setPracticeMode: (mode: 'on-demand' | null) => void;
}

const marketplaceItems: MarketplaceItem[] = [
    { id: 'powerup-1', title: 'On-Demand Practice Paper', description: 'Generate a new, custom practice paper in the Practice Centre by selecting the chapters you want to focus on.', cost: 500, category: 'power-up', action: { type: 'navigate', payload: 'practice' } },
    { id: 'powerup-2', title: 'AI Tutor Priority Pass', description: 'Get an extended, uninterrupted session with MIGA, our most advanced AI tutor.', cost: 100, category: 'power-up', action: { type: 'unlock', payload: 'tutor' } },
    { id: 'powerup-3', title: 'Concept Deep Dive', description: 'Request a hyper-detailed explanation of a tough concept with advanced examples.', cost: 250, category: 'power-up', action: { type: 'navigate', payload: 'tools' } },
    { id: 'custom-1', title: 'Exclusive Profile Border', description: 'Show off your skills with a unique animated profile border.', cost: 1000, category: 'customization', action: { type: 'redeem', payload: 'border' } },
    { id: 'custom-2', title: 'Study Pet Accessory', description: 'Get a new hat or accessory for your study pet.', cost: 200, category: 'customization', action: { type: 'redeem', payload: 'pet-hat' } },
    { id: 'voucher-1', title: 'Bookstore Voucher (₹100)', description: 'Get a ₹100 voucher for a partner bookstore. (Coming Soon!)', cost: 5000, category: 'voucher', action: { type: 'redeem', payload: 'voucher-book-100' } },
];

const ScholarWallet: React.FC<ScholarWalletProps> = ({ setView, setPracticeMode }) => {
    const { activeProfile, handleUpdateScholarCoins, handleSetTutorLock, updateActiveUserProfile } = useAuth();
    const [purchaseFeedback, setPurchaseFeedback] = useState<{ id: string, message: string } | null>(null);

    if (!activeProfile) return null;

    const handlePurchase = (item: MarketplaceItem) => {
        if (activeProfile.scholarCoins < item.cost) {
            alert("You don't have enough Scholar Coins for this item.");
            return;
        }

        handleUpdateScholarCoins(activeProfile.scholarCoins - item.cost);

        switch (item.action.type) {
            case 'navigate':
                if (item.id === 'powerup-1') {
                    setPracticeMode('on-demand');
                }
                setView(item.action.payload);
                break;
            case 'unlock':
                if (item.id === 'powerup-2') {
                    handleSetTutorLock(true);
                     setPurchaseFeedback({ id: item.id, message: "Priority Pass unlocked for this session!" });
                }
                break;
            case 'redeem':
                if (item.action.payload === 'pet-hat') {
                    const currentAccessories = activeProfile.unlockedPetAccessories || [];
                    if (!currentAccessories.includes('pet-hat')) {
                        updateActiveUserProfile({ unlockedPetAccessories: [...currentAccessories, 'pet-hat'] });
                    }
                    setPurchaseFeedback({ id: item.id, message: "Hat unlocked for pet!" });
                } else if (item.id.includes('voucher')) {
                    const code = `ALFA-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
                    setPurchaseFeedback({ id: item.id, message: `Redeemed! Your code: ${code}` });
                } else {
                    setPurchaseFeedback({ id: item.id, message: "Customization Unlocked!" });
                }
                break;
        }
        
        if(item.action.type !== 'navigate') {
            setTimeout(() => setPurchaseFeedback(null), 3000);
        }
    };

    return (
        <div className="animate-slide-in-up">
            <div className="flex justify-between items-center mb-6 p-4 bg-white rounded-xl shadow-sm border">
                <h1 className="text-3xl font-extrabold text-slate-800">Scholar's Wallet</h1>
                <div className="flex items-center gap-2 p-2 px-4 bg-amber-400 rounded-full text-amber-900 shadow-md">
                    <ScholarCoinIcon className="w-6 h-6" />
                    <span className="font-bold text-lg">{activeProfile.scholarCoins}</span>
                </div>
            </div>

            <div className="space-y-8">
                <div>
                    <h2 className="text-2xl font-bold text-slate-700 mb-4">Academic Power-Ups</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {marketplaceItems.filter(i => i.category === 'power-up').map(item => (
                            <div key={item.id} className="bg-white p-5 rounded-xl shadow-sm border flex flex-col">
                                <h3 className="font-bold text-lg text-slate-800">{item.title}</h3>
                                <p className="text-sm text-slate-500 mt-1 flex-grow">{item.description}</p>
                                <button
                                    onClick={() => handlePurchase(item)}
                                    disabled={activeProfile.scholarCoins < item.cost || (purchaseFeedback?.id === item.id)}
                                    className="btn btn-primary w-full mt-4 flex items-center justify-center gap-2"
                                >
                                    {purchaseFeedback?.id === item.id ? (
                                        <><CheckCircleIcon className="w-5 h-5"/> {purchaseFeedback.message}</>
                                    ) : (
                                        `Get for ${item.cost} SC`
                                    )}
                                </button>
                            </div>
                        ))}
                    </div>
                </div>
                
                 <div>
                    <h2 className="text-2xl font-bold text-slate-700 mb-4">Personalization</h2>
                     <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {marketplaceItems.filter(i => i.category === 'customization').map(item => (
                             <div key={item.id} className="bg-white p-5 rounded-xl shadow-sm border flex flex-col">
                                <h3 className="font-bold text-lg text-slate-800">{item.title}</h3>
                                <p className="text-sm text-slate-500 mt-1 flex-grow">{item.description}</p>
                                <button
                                    onClick={() => handlePurchase(item)}
                                    disabled={activeProfile.scholarCoins < item.cost || (purchaseFeedback?.id === item.id)}
                                    className="btn btn-primary w-full mt-4 flex items-center justify-center gap-2"
                                >
                                     {purchaseFeedback?.id === item.id ? (
                                        <><CheckCircleIcon className="w-5 h-5"/> {purchaseFeedback.message}</>
                                    ) : (
                                        `Get for ${item.cost} SC`
                                    )}
                                </button>
                            </div>
                        ))}
                    </div>
                </div>
                
                 <div>
                    <h2 className="text-2xl font-bold text-slate-700 mb-4">Vouchers (Coming Soon)</h2>
                     <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {marketplaceItems.filter(i => i.category === 'voucher').map(item => (
                             <div key={item.id} className="bg-white p-5 rounded-xl shadow-sm border flex flex-col">
                                <h3 className="font-bold text-lg text-slate-800">{item.title}</h3>
                                <p className="text-sm text-slate-500 mt-1 flex-grow">{item.description}</p>
                                <button
                                    onClick={() => handlePurchase(item)}
                                    disabled={activeProfile.scholarCoins < item.cost || (purchaseFeedback?.id === item.id)}
                                    className="btn btn-primary w-full mt-4 flex items-center justify-center gap-2"
                                >
                                     {purchaseFeedback?.id === item.id ? (
                                        <><CheckCircleIcon className="w-5 h-5"/> {purchaseFeedback.message}</>
                                    ) : (
                                        `Get for ${item.cost} SC`
                                    )}
                                </button>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ScholarWallet;