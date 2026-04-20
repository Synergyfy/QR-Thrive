import { useState, useMemo } from 'react';
import { 
  Search, 
  MapPin, 
  Check, 
  MousePointer2, 
  ArrowRightLeft,
  Box,
  Globe2,
  GripHorizontal,
  Settings,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import type { DropResult } from '@hello-pangea/dnd';
import { Tooltip } from '../../../components/ui/Tooltip';
import type { Country, PricingTier } from '../../../types/api';
import { useUpdateCountry } from '../../../hooks/useAdmin';
import toast from 'react-hot-toast';

interface RegionalLogicProps {
  countries: Country[];
  tiers: { id: PricingTier; name: string }[];
  onUpdateCountryTier: (code: string, tier: PricingTier) => void;
  onBulkMove: (codes: string[], tier: PricingTier) => void;
}

export default function RegionalLogic({
  countries,
  tiers,
  onUpdateCountryTier,
  onBulkMove
}: RegionalLogicProps) {
  const [search, setSearch] = useState('');
  const [selectedCodes, setSelectedCodes] = useState<Set<string>>(new Set());
  const [editingCountry, setEditingCountry] = useState<Country | null>(null);

  const updateCountry = useUpdateCountry();

  const filteredCountries = useMemo(() => {
    return countries.filter(c => 
      c.name.toLowerCase().includes(search.toLowerCase()) || 
      c.code.toLowerCase().includes(search.toLowerCase())
    );
  }, [countries, search]);

  const groupedCountries = useMemo(() => {
    const grouped: Record<string, Country[]> = {};
    tiers.forEach(t => grouped[t.id] = []);
    filteredCountries.forEach(c => {
      if (grouped[c.tier]) grouped[c.tier].push(c);
    });
    return grouped;
  }, [filteredCountries, tiers]);

  const handleDragEnd = (result: DropResult) => {
    if (!result.destination) return;
    const { draggableId: code, source, destination } = result;
    if (source.droppableId !== destination.droppableId) {
      onUpdateCountryTier(code, destination.droppableId as PricingTier);
    }
  };

  const toggleSelection = (code: string) => {
    const next = new Set(selectedCodes);
    if (next.has(code)) next.delete(code);
    else next.add(code);
    setSelectedCodes(next);
  };

  const handleBulkMoveAction = (tier: PricingTier) => {
    onBulkMove(Array.from(selectedCodes), tier);
    setSelectedCodes(new Set());
  };

  const handleSaveCountrySettings = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingCountry) return;

    const promise = updateCountry.mutateAsync(editingCountry);

    toast.promise(promise, {
      loading: 'Updating regional settings...',
      success: 'Regional configuration saved!',
      error: 'Failed to update settings.'
    });

    await promise;
    setEditingCountry(null);
  };

  return (
    <div className="space-y-8">
      {/* Search Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 bg-white p-6 rounded-[2.5rem] border border-slate-100 shadow-sm">
        <div className="flex items-center gap-4">
           <div className="w-12 h-12 bg-slate-900 rounded-2xl flex items-center justify-center text-white shadow-lg text-xl font-black">
              <Globe2 className="w-6 h-6" />
           </div>
           <div>
              <h3 className="text-lg font-black text-slate-900 tracking-tight">Regional Distribution</h3>
              <p className="text-slate-500 font-medium text-xs leading-relaxed">Organize countries into economic groups to control global pricing.</p>
           </div>
        </div>

        <div className="relative group min-w-[300px]">
           <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-blue-500 transition-colors" />
           <input 
              type="text" 
              placeholder="Search by name or code..." 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-slate-50 border-none rounded-2xl py-3.5 pl-11 pr-4 text-xs font-black text-slate-900 focus:ring-4 focus:ring-blue-500/10 outline-none transition-all placeholder:text-slate-300"
           />
        </div>
      </div>

      <DragDropContext onDragEnd={handleDragEnd}>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {tiers.map((tier) => (
            <div key={tier.id} className="flex flex-col h-[650px] bg-white border border-slate-100 rounded-[2.5rem] shadow-sm overflow-hidden group">
              {/* Tier Header */}
              <div className="p-6 border-b border-slate-50 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center">
                    <Box className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-sm font-black text-slate-900">{tier.name}</h4>
                    <span className="text-[10px] font-black uppercase text-slate-400 tracking-widest">
                       {groupedCountries[tier.id]?.length || 0} Territories
                    </span>
                  </div>
                </div>
                
                <button 
                   onClick={() => {
                      const tierCodes = groupedCountries[tier.id].map(c => c.code);
                      const allSelected = tierCodes.every(c => selectedCodes.has(c));
                      const next = new Set(selectedCodes);
                      if (allSelected) tierCodes.forEach(c => next.delete(c));
                      else tierCodes.forEach(c => next.add(c));
                      setSelectedCodes(next);
                   }}
                   className={`p-2 rounded-lg transition-all ${
                     groupedCountries[tier.id]?.length && groupedCountries[tier.id].every(c => selectedCodes.has(c.code))
                       ? 'bg-blue-600 text-white'
                       : 'bg-slate-50 text-slate-400 hover:text-blue-600'
                   }`}
                >
                   <Check className="w-4 h-4" />
                </button>
              </div>

              {/* Tier Body (Droppable) */}
              <Droppable droppableId={tier.id}>
                {(provided, snapshot) => (
                  <div 
                    ref={provided.innerRef}
                    {...provided.droppableProps}
                    className={`flex-grow overflow-y-auto p-4 space-y-2 scrollbar-hide transition-colors ${
                      snapshot.isDraggingOver ? 'bg-blue-50/50' : 'bg-transparent'
                    }`}
                  >
                    {groupedCountries[tier.id].map((country, index) => (
                      <Draggable key={country.code} draggableId={country.code} index={index}>
                        {(dragProvided, dragSnapshot) => (
                          <div
                            ref={dragProvided.innerRef}
                            {...dragProvided.draggableProps}
                            className={`flex items-center gap-3 p-3 rounded-xl border transition-all ${
                              dragSnapshot.isDragging 
                                ? 'bg-white border-blue-500 shadow-2xl z-50 scale-105' 
                                : selectedCodes.has(country.code)
                                  ? 'bg-blue-50/50 border-blue-200'
                                  : 'bg-white border-transparent hover:border-slate-100'
                            }`}
                          >
                            <div {...dragProvided.dragHandleProps} className="text-slate-300 hover:text-slate-600 cursor-grab active:cursor-grabbing">
                               <GripHorizontal className="w-4 h-4" />
                            </div>
                            
                            <label className="relative flex items-center cursor-pointer">
                               <input 
                                  type="checkbox" 
                                  className="hidden" 
                                  checked={selectedCodes.has(country.code)}
                                  onChange={() => toggleSelection(country.code)}
                               />
                               <div className={`w-5 h-5 rounded-lg border-2 flex items-center justify-center transition-all ${
                                 selectedCodes.has(country.code) ? 'bg-blue-600 border-blue-600 text-white' : 'bg-white border-slate-200'
                               }`}>
                                  <Check className={`w-3 h-3 ${selectedCodes.has(country.code) ? 'scale-100' : 'scale-0'}`} />
                               </div>
                            </label>

                            <div className="flex-grow min-w-0">
                               <p className="text-xs font-black text-slate-900 truncate">{country.name}</p>
                               <div className="flex items-center gap-2">
                                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">{country.code}</span>
                                  <span className="w-1 h-1 rounded-full bg-slate-200" />
                                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">{country.currencyCode}</span>
                                  {country.taxRate > 0 && (
                                    <>
                                      <span className="w-1 h-1 rounded-full bg-slate-200" />
                                      <span className="text-[10px] font-bold text-emerald-500 uppercase tracking-tighter">{country.taxRate}% Tax</span>
                                    </>
                                  )}
                               </div>
                            </div>

                            <button 
                              onClick={() => setEditingCountry(country)}
                              className="p-2 bg-slate-50 text-slate-400 hover:text-blue-600 hover:bg-white hover:shadow-md rounded-lg transition-all"
                            >
                               <Settings className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        )}
                      </Draggable>
                    ))}
                    {provided.placeholder}
                    
                    {groupedCountries[tier.id].length === 0 && !snapshot.isDraggingOver && (
                       <div className="h-full flex flex-col items-center justify-center text-center py-10 opacity-40">
                          <MapPin className="w-10 h-10 text-slate-300 mb-2" />
                          <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Empty Group</p>
                       </div>
                    )}
                  </div>
                )}
              </Droppable>
            </div>
          ))}
        </div>
      </DragDropContext>

      {/* Bulk Action Bar */}
      <AnimatePresence>
        {selectedCodes.size > 0 && (
          <motion.div
            initial={{ y: 50, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 50, opacity: 0 }}
            className="fixed bottom-10 left-1/2 -translate-x-1/2 z-[100] w-[90%] max-w-2xl"
          >
            <div className="bg-slate-900/90 backdrop-blur-xl border border-white/10 p-4 rounded-[2rem] shadow-2xl flex items-center justify-between gap-6 overflow-hidden">
               <div className="flex items-center gap-4 pl-4">
                  <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center text-white">
                     <MousePointer2 className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-white font-black text-sm">{selectedCodes.size} <span className="opacity-60 text-xs font-medium uppercase tracking-widest ml-1">Territories</span></p>
                    <button onClick={() => setSelectedCodes(new Set())} className="text-[10px] font-black text-blue-400 uppercase tracking-widest hover:text-blue-300">Deselect All</button>
                  </div>
               </div>

               <div className="flex gap-2 pr-2">
                  <div className="relative group min-w-[200px]">
                     <select 
                        className="w-full bg-slate-800 border-none rounded-2xl py-3.5 pl-4 pr-10 text-xs font-black text-white appearance-none cursor-pointer focus:ring-4 focus:ring-blue-500/20 outline-none"
                        onChange={(e) => {
                          if (e.target.value) handleBulkMoveAction(e.target.value as PricingTier);
                        }}
                        value=""
                     >
                        <option value="" disabled>Relocate selection to...</option>
                        {tiers.map(t => (
                          <option key={t.id} value={t.id}>{t.name}</option>
                        ))}
                     </select>
                     <ArrowRightLeft className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 pointer-events-none" />
                  </div>
               </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Country Editor Modal */}
      <AnimatePresence>
        {editingCountry && (
          <div className="fixed inset-0 z-[500] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setEditingCountry(null)}
              className="absolute inset-0 bg-slate-900/60 backdrop-blur-md"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative w-full max-w-lg bg-white rounded-[3rem] shadow-2xl overflow-hidden p-10"
            >
               <div className="flex items-center gap-4 mb-2">
                  <div className="w-14 h-14 bg-slate-900 rounded-2xl flex items-center justify-center text-white text-xl font-black">
                     {editingCountry.code}
                  </div>
                  <div>
                     <h3 className="text-2xl font-black text-slate-900 tracking-tight">{editingCountry.name}</h3>
                     <p className="text-slate-400 text-[10px] font-black uppercase tracking-[0.2em]">Regional Logic Control</p>
                  </div>
               </div>

               <form onSubmit={handleSaveCountrySettings} className="mt-10 space-y-8">
                  <div className="space-y-3">
                     <Tooltip content="Which pricing level should apply to this country?">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1 cursor-help">Assigned Economic Tier</label>
                     </Tooltip>
                     <div className="grid grid-cols-3 gap-3">
                        {tiers.map(t => (
                           <button
                             key={t.id}
                             type="button"
                             onClick={() => setEditingCountry({ ...editingCountry, tier: t.id })}
                             className={`py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest border transition-all ${
                               editingCountry.tier === t.id 
                                ? 'bg-slate-900 border-slate-900 text-white shadow-xl shadow-slate-900/20' 
                                : 'bg-slate-50 border-transparent text-slate-400 hover:border-slate-200'
                             }`}
                           >
                              {t.name.split(' ')[0]}
                           </button>
                        ))}
                     </div>
                  </div>

                  <div className="grid grid-cols-2 gap-6">
                     <div className="space-y-2">
                        <Tooltip content="The 3-letter currency code (e.g. USD, EUR, NGN).">
                           <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1 cursor-help">Currency ISO</label>
                        </Tooltip>
                        <input 
                          type="text"
                          value={editingCountry.currencyCode}
                          onChange={(e) => setEditingCountry({ ...editingCountry, currencyCode: e.target.value.toUpperCase() })}
                          className="w-full bg-slate-50 border-none rounded-2xl p-4 text-sm font-black text-slate-900 outline-none"
                        />
                     </div>
                     <div className="space-y-2">
                        <Tooltip content="The symbol used for prices ($ , ₦, €, etc).">
                           <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1 cursor-help">Display Symbol</label>
                        </Tooltip>
                        <input 
                          type="text"
                          value={editingCountry.currencySymbol}
                          onChange={(e) => setEditingCountry({ ...editingCountry, currencySymbol: e.target.value })}
                          className="w-full bg-slate-50 border-none rounded-2xl p-4 text-sm font-black text-slate-900 outline-none"
                        />
                     </div>
                  </div>

                  <div className="space-y-2">
                     <Tooltip content="Tax percentage added during checkout.">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1 cursor-help">Regional Tax (%)</label>
                     </Tooltip>
                     <div className="relative">
                        <input 
                          type="number"
                          step="0.1"
                          value={editingCountry.taxRate}
                          onChange={(e) => setEditingCountry({ ...editingCountry, taxRate: Number(e.target.value) })}
                          className="w-full bg-slate-50 border-none rounded-2xl p-4 text-sm font-black text-slate-900 outline-none"
                        />
                        <span className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-300 font-black text-xs">%</span>
                     </div>
                  </div>

                  <div className="flex gap-4 pt-6 border-t border-slate-50">
                     <button
                       type="button"
                       onClick={() => setEditingCountry(null)}
                       className="flex-grow py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest text-slate-400 hover:text-slate-900 transition-colors"
                     >
                       Cancel
                     </button>
                     <button
                       type="submit"
                       className="flex-grow py-4 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all shadow-xl shadow-blue-600/20 active:scale-95"
                     >
                       Confirm Logic
                     </button>
                  </div>
               </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
