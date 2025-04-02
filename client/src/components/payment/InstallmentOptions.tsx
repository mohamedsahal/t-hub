import { useState, useEffect } from "react";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { formatCurrency, calculateInstallments } from "@/lib/utils";

interface InstallmentOptionsProps {
  totalAmount: number;
  onSelectPlan: (plan: { months: number; amounts: number[] }) => void;
}

const InstallmentOptions = ({ totalAmount, onSelectPlan }: InstallmentOptionsProps) => {
  const [selectedMonths, setSelectedMonths] = useState<number>(3);
  
  // Available installment periods
  const availableOptions = [
    { months: 3, label: "3 months" },
    { months: 6, label: "6 months" },
    { months: 12, label: "12 months" },
  ];
  
  useEffect(() => {
    // Calculate installment amounts and pass to parent
    const amounts = calculateInstallments(totalAmount, selectedMonths);
    onSelectPlan({ months: selectedMonths, amounts });
  }, [totalAmount, selectedMonths, onSelectPlan]);
  
  // Format the monthly amount
  const getMonthlyAmount = (months: number) => {
    const installmentAmount = totalAmount / months;
    return formatCurrency(installmentAmount);
  };
  
  return (
    <div className="space-y-4">
      <div className="text-sm font-medium">Select your installment plan:</div>
      
      <RadioGroup 
        defaultValue={selectedMonths.toString()} 
        onValueChange={(value) => setSelectedMonths(parseInt(value))}
      >
        {availableOptions.map((option) => (
          <div 
            key={option.months}
            className={`flex items-center justify-between border rounded-lg p-4 ${
              selectedMonths === option.months ? "border-primary bg-primary/5" : "border-gray-200"
            }`}
          >
            <div className="flex items-center space-x-2">
              <RadioGroupItem 
                value={option.months.toString()} 
                id={`option-${option.months}`} 
              />
              <Label htmlFor={`option-${option.months}`} className="font-normal">
                {option.label}
              </Label>
            </div>
            <div className="text-right">
              <div className="font-medium">{getMonthlyAmount(option.months)}</div>
              <div className="text-sm text-gray-500">per month</div>
            </div>
          </div>
        ))}
      </RadioGroup>
      
      <div className="text-sm text-gray-500 italic">
        * First installment is due at enrollment, remaining payments will be due monthly
      </div>
      
      <div className="bg-gray-50 border border-gray-200 rounded-md p-4">
        <div className="flex justify-between font-medium mb-2">
          <span>Total course price:</span>
          <span>{formatCurrency(totalAmount)}</span>
        </div>
        <div className="flex justify-between text-green-600">
          <span>Initial payment today:</span>
          <span>{getMonthlyAmount(selectedMonths)}</span>
        </div>
      </div>
    </div>
  );
};

export default InstallmentOptions;
