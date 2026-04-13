import { useState, useMemo } from 'react';
import { 
  Search, 
  MapPin, 
  Check, 
  MousePointer2, 
  ArrowRightLeft,
  Box,
  Globe2,
  GripHorizontal
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import type { DropResult } from '@hello-pangea/dnd';
import type { Country, PricingTier } from '../../../types/api';

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

  return (
    <div className="space-y-8">
      {/* Search Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 bg-white p-6 rounded-[2.5rem] border border-slate-100 shadow-sm">
        <div className="flex items-center gap-4">
           <div className="w-12 h-12 bg-slate-900 rounded-2xl flex items-center justify-center text-white shadow-lg">
              <Globe2 className="w-6 h-6" />
           </div>
           <div>
              <h3 className="text-lg font-black text-slate-900">Regional Distribution</h3>
              <p className="text-slate-500 font-medium text-xs">Assign countries to economic tiers for dynamic pricing.</p>
           </div>
        </div>

        <div className="relative group min-w-[300px]">
           <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-blue-500 transition-colors" />
           <input 
              type="text" 
              placeholder="Filter regions..." 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-slate-50 border-none rounded-2xl py-3.5 pl-11 pr-4 text-xs font-black text-slate-900 focus:ring-4 focus:ring-blue-500/10 outline-none transition-all"
           />
        </div>
      </div>

      <DragDropContext onDragEnd={handleDragEnd}>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {tiers.map((tier) => (
            <div key={tier.id} className="flex flex-col h-[600px] bg-white border border-slate-100 rounded-[2.5rem] shadow-sm overflow-hidden group">
              {/* Tier Header */}
              <div className="p-6 border-b border-slate-50 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center">
                    <Box className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-sm font-black text-slate-900">{tier.name}</h4>
                    <span className="text-[10px] font-black uppercase text-slate-400 tracking-widest">
                       {groupedCountries[tier.id]?.length || 0} Regions
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
                                  <span className="text-[10px] font-bold text-slate-400 uppercase">{country.code}</span>
                                  <span className="w-1 h-1 rounded-full bg-slate-200" />
                                  <span className="text-[10px] font-bold text-slate-400 uppercase">{country.currencyCode}</span>
                               </div>
                            </div>
                          </div>
                        )}
                      </Draggable>
                    ))}
                    {provided.placeholder}
                    
                    {groupedCountries[tier.id].length === 0 && !snapshot.isDraggingOver && (
                       <div className="h-full flex flex-col items-center justify-center text-center py-10 opacity-40">
                          <MapPin className="w-10 h-10 text-slate-300 mb-2" />
                          <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Empty Tier</p>
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
                    <p className="text-white font-black text-sm">{selectedCodes.size} <span className="opacity-60">Regions</span></p>
                    <button onClick={() => setSelectedCodes(new Set())} className="text-[10px] font-black text-blue-400 uppercase tracking-widest hover:text-blue-300">Clear</button>
                  </div>
               </div>

               <div className="flex gap-2">
                  <div className="relative group min-w-[180px]">
                     <select 
                        className="w-full bg-slate-800 border-none rounded-xl py-3 pl-4 pr-10 text-xs font-black text-white appearance-none cursor-pointer focus:ring-4 focus:ring-blue-500/20"
                        onChange={(e) => {
                          if (e.target.value) handleBulkMoveAction(e.target.value as PricingTier);
                        }}
                        value=""
                     >
                        <option value="" disabled>Move selection to...</option>
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
    </div>
  );
}
