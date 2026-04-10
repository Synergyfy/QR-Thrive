import React from 'react';
import { 
  Plus, 
  Trash2, 
  GripVertical, 
  ChevronDown, 
  Type, 
  Mail, 
  Phone as PhoneIcon, 
  Hash, 
  AlignLeft,
  Calendar,
  ToggleLeft,
  CheckSquare, 
  List, 
  CircleDot, 
  SlidersHorizontal,
  X,
  ChevronUp
} from 'lucide-react';
import type { FormField } from '../types/form';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) { return twMerge(clsx(inputs)); }

interface FormBuilderProps {
  fields: FormField[];
  onChange: (fields: FormField[]) => void;
}

const FIELD_TYPES = [
  { id: 'text', label: 'Short Text', icon: Type },
  { id: 'textarea', label: 'Long Text', icon: AlignLeft },
  { id: 'email', label: 'Email', icon: Mail },
  { id: 'phone', label: 'Phone', icon: PhoneIcon },
  { id: 'number', label: 'Number', icon: Hash },
  { id: 'date', label: 'Date', icon: Calendar },
  { id: 'boolean', label: 'Yes/No', icon: ToggleLeft },
  { id: 'checkbox', label: 'Checkbox', icon: CheckSquare },
  { id: 'select', label: 'Dropdown', icon: List },
] as const;

const FormBuilder: React.FC<FormBuilderProps> = ({ fields, onChange }) => {
  const addField = (type: FormField['type']) => {
    const newField: FormField = {
      id: Math.random().toString(36).substring(7),
      type,
      label: `New ${type.charAt(0).toUpperCase() + type.slice(1)} Field`,
      required: false,
      order: fields.length,
      placeholder: '',
      helpText: '',
    };
    
    if (type === 'select' || type === 'radio' || type === 'checkbox') {
      newField.options = [
        { label: 'Option 1', value: 'option1' },
        { label: 'Option 2', value: 'option2' },
      ];
    }

    if (type === 'range') {
      newField.validation = { min: 0, max: 10, step: 1 };
    }

    onChange([...fields, newField]);
  };

  const removeField = (id: string) => {
    onChange(fields.filter(f => f.id !== id));
  };

  const updateField = (id: string, updates: Partial<FormField>) => {
    onChange(fields.map(f => f.id === id ? { ...f, ...updates } : f));
  };

  const moveField = (index: number, direction: 'up' | 'down') => {
    const newFields = [...fields];
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= newFields.length) return;
    
    const [moved] = newFields.splice(index, 1);
    newFields.splice(targetIndex, 0, moved);
    
    // Update order
    onChange(newFields.map((f, i) => ({ ...f, order: i })));
  };

  return (
    <div className="space-y-6">
      {/* Field List */}
      <div className="space-y-4">
        {fields.map((field, index) => (
          <div 
            key={field.id}
            className="bg-white border-2 border-slate-100 rounded-[32px] p-6 shadow-sm hover:shadow-md transition-all group animate-in slide-in-from-top-2 duration-300"
          >
            <div className="flex items-start gap-4">
              <div className="pt-2 flex flex-col gap-1">
                 <button 
                  disabled={index === 0}
                  onClick={() => moveField(index, 'up')}
                  className="p-1 hover:bg-slate-50 text-slate-300 hover:text-blue-600 disabled:opacity-0"
                 >
                   <ChevronUp className="w-4 h-4" />
                 </button>
                 <div className="p-1 text-slate-300">
                   <GripVertical className="w-4 h-4" />
                 </div>
                 <button 
                  disabled={index === fields.length - 1}
                  onClick={() => moveField(index, 'down')}
                  className="p-1 hover:bg-slate-50 text-slate-300 hover:text-blue-600 disabled:opacity-0"
                 >
                   <ChevronDown className="w-4 h-4" />
                 </button>
              </div>

              <div className="flex-1 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                      {React.createElement(FIELD_TYPES.find(t => t.id === field.type)?.icon || Type, { className: "w-4 h-4" })}
                    </div>
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none">
                      {FIELD_TYPES.find(t => t.id === field.type)?.label}
                    </span>
                  </div>
                  <button 
                    onClick={() => removeField(field.id)}
                    className="p-2 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">Field Label</p>
                    <input 
                      type="text"
                      value={field.label}
                      onChange={(e) => updateField(field.id, { label: e.target.value })}
                      placeholder="e.g. Your Full Name"
                      className="w-full px-4 py-3 bg-slate-50 border-2 border-slate-50 focus:border-blue-600 rounded-2xl outline-none text-sm font-bold transition-all"
                    />
                  </div>
                  <div className="space-y-2">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">Placeholder (Optional)</p>
                    <input 
                      type="text"
                      value={field.placeholder}
                      onChange={(e) => updateField(field.id, { placeholder: e.target.value })}
                      placeholder="e.g. John Doe"
                      className="w-full px-4 py-3 bg-slate-50 border-2 border-slate-50 focus:border-blue-600 rounded-2xl outline-none text-sm font-bold transition-all"
                    />
                  </div>
                </div>

                {/* Additional Options */}
                <div className="flex items-center gap-6 pt-2">
                   <label className="flex items-center gap-3 cursor-pointer group/toggle">
                      <div className="relative">
                        <input 
                          type="checkbox" 
                          className="sr-only"
                          checked={field.required}
                          onChange={(e) => updateField(field.id, { required: e.target.checked })}
                        />
                        <div className={cn(
                          "w-10 h-6 rounded-full transition-all duration-300",
                          field.required ? "bg-blue-600" : "bg-slate-200"
                        )} />
                        <div className={cn(
                          "absolute top-1 left-1 w-4 h-4 bg-white rounded-full transition-all duration-300",
                          field.required ? "translate-x-4" : "translate-x-0"
                        )} />
                      </div>
                      <span className="text-xs font-bold text-slate-600 group-hover/toggle:text-slate-900 transition-colors">Required Field</span>
                   </label>
                </div>

                {/* Field Specific Config */}
                {(field.type === 'select' || field.type === 'radio' || field.type === 'checkbox') && (
                  <div className="pt-4 border-t border-slate-50 space-y-3">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">Options</p>
                    <div className="space-y-3">
                      {field.options?.map((opt, optIdx) => (
                        <div key={optIdx} className="flex items-center gap-3 animate-in fade-in slide-in-from-left-2 transition-all">
                          <input 
                            type="text"
                            value={opt.label}
                            onChange={(e) => {
                              const newOpts = [...(field.options || [])];
                              newOpts[optIdx] = { label: e.target.value, value: e.target.value.toLowerCase().replace(/\s+/g, '_') };
                              updateField(field.id, { options: newOpts });
                            }}
                            className="flex-1 px-4 py-2 bg-white border-2 border-slate-100 focus:border-blue-600 rounded-xl outline-none text-xs font-bold shadow-sm"
                          />
                          <button 
                            onClick={() => {
                              const newOpts = field.options?.filter((_, i) => i !== optIdx);
                              updateField(field.id, { options: newOpts });
                            }}
                            className="p-2 text-slate-300 hover:text-red-500 transition-all"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ))}
                      <button 
                        onClick={() => {
                          const newOpts = [...(field.options || []), { label: `Option ${field.options?.length ? field.options.length + 1 : 1}`, value: `opt_${Date.now()}` }];
                          updateField(field.id, { options: newOpts });
                        }}
                        className="text-[10px] font-black text-blue-600 uppercase tracking-widest flex items-center gap-2 px-4 py-2 hover:bg-blue-50 rounded-xl transition-all"
                      >
                        <Plus className="w-3 h-3" /> Add Option
                      </button>
                    </div>
                  </div>
                )}

                {field.type === 'range' && (
                   <div className="pt-4 border-t border-slate-50 grid grid-cols-3 gap-4">
                      <div className="space-y-2">
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Min Value</p>
                        <input 
                          type="number"
                          value={field.validation?.min}
                          onChange={(e) => updateField(field.id, { validation: { ...field.validation, min: parseInt(e.target.value) } })}
                          className="w-full px-4 py-2 bg-white border-2 border-slate-100 rounded-xl text-xs font-bold"
                        />
                      </div>
                      <div className="space-y-2">
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Max Value</p>
                        <input 
                          type="number"
                          value={field.validation?.max}
                          onChange={(e) => updateField(field.id, { validation: { ...field.validation, max: parseInt(e.target.value) } })}
                          className="w-full px-4 py-2 bg-white border-2 border-slate-100 rounded-xl text-xs font-bold"
                        />
                      </div>
                      <div className="space-y-2">
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Step</p>
                        <input 
                          type="number"
                          value={field.validation?.step}
                          onChange={(e) => updateField(field.id, { validation: { ...field.validation, step: parseInt(e.target.value) } })}
                          className="w-full px-4 py-2 bg-white border-2 border-slate-100 rounded-xl text-xs font-bold"
                        />
                      </div>
                   </div>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Add Field Buttons */}
      <div className="space-y-4">
        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Add Question Field</p>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {FIELD_TYPES.map((type) => (
            <button
              key={type.id}
              onClick={() => addField(type.id)}
              className="flex items-center gap-3 p-4 bg-white border-2 border-slate-50 hover:border-blue-600 hover:shadow-xl hover:shadow-blue-50 rounded-2xl transition-all group active:scale-95"
            >
              <div className="w-10 h-10 rounded-xl bg-slate-50 text-slate-400 group-hover:bg-blue-600 group-hover:text-white flex items-center justify-center transition-all">
                <type.icon className="w-5 h-5" />
              </div>
              <span className="text-[10px] font-black text-slate-600 group-hover:text-slate-900 uppercase tracking-widest text-left">
                {type.label}
              </span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default FormBuilder;
