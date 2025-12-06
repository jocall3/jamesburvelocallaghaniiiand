
import * as React from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { toast } from "sonner";
import { Check, ChevronsUpDown } from "lucide-react";

import { cn } from "../lib/utils";
import { useStripeNexus } from "@/components/stripe-nexus/stripe-nexus-provider";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "./ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "./ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "./ui/popover";
import { Input } from "./ui/input";
import { Button } from "./ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { NexusResourceJSON } from "@/components/stripe-nexus/NexusResourceJSON";
import { Charge } from "@/lib/stripe-nexus-types";

const generateId = (length = 14) => {
  const chars = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let result = "";
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
};


const RefundForm = () => {
  const { data } = useStripeNexus();
  const [createdRefund, setCreatedRefund] = React.useState<object | null>(null);
  const [selectedCharge, setSelectedCharge] = React.useState<Charge | null>(null);

  const refundableCharges = React.useMemo(() => {
    return data.charge.filter(
      (c) => c.status === "succeeded" && !c.refunded && c.amount > c.amount_refunded
    );
  }, [data.charge]);

  const refundFormSchema = z.object({
    chargeId: z.string({ required_error: "Please select a charge to refund." }).startsWith("ch_"),
    amount: z.coerce
      .number({ required_error: "Please enter a refund amount." })
      .positive("Amount must be a positive number.")
      .max(
        selectedCharge ? (selectedCharge.amount - selectedCharge.amount_refunded) / 100 : Infinity,
        `Amount cannot exceed the refundable balance.`
      ),
    reason: z.enum(["duplicate", "fraudulent", "requested_by_customer", ""]).optional(),
  });

  const form = useForm<z.infer<typeof refundFormSchema>>({
    resolver: zodResolver(refundFormSchema),
    defaultValues: {
      chargeId: "",
      amount: undefined,
      reason: "",
    },
  });

  React.useEffect(() => {
    const subscription = form.watch((value, { name }) => {
      if (name === "chargeId" && value.chargeId) {
        const newSelectedCharge = refundableCharges.find(c => c.id === value.chargeId) || null;
        setSelectedCharge(newSelectedCharge);
        // Reset amount when charge changes
        form.setValue("amount", (newSelectedCharge ? (newSelectedCharge.amount - newSelectedCharge.amount_refunded) / 100 : 0));
        form.trigger("amount");
      }
    });
    return () => subscription.unsubscribe();
  }, [form, refundableCharges]);


  function onSubmit(values: z.infer<typeof refundFormSchema>) {
    if (!selectedCharge) {
      toast.error("Invalid charge selected.");
      return;
    }

    const refundAmountInCents = Math.round(values.amount * 100);

    const newRefund = {
        id: `re_${generateId()}`,
        object: "refund",
        amount: refundAmountInCents,
        balance_transaction: null,
        charge: selectedCharge.id,
        created: Math.floor(Date.now() / 1000),
        currency: selectedCharge.currency,
        metadata: {},
        payment_intent: selectedCharge.payment_intent,
        reason: values.reason || null,
        receipt_number: null,
        source_transfer_reversal: null,
        status: "succeeded",
        transfer_reversal: null,
    };

    setCreatedRefund(newRefund);
    toast.success("Mock Refund Created", {
      description: `Refund of ${new Intl.NumberFormat('en-US', { style: 'currency', currency: selectedCharge.currency }).format(values.amount)} for charge ${selectedCharge.id}.`,
    });
  }

  const getRefundableAmountText = () => {
    if (!selectedCharge) return "";
    const refundable = (selectedCharge.amount - selectedCharge.amount_refunded) / 100;
    return `Max refundable: ${new Intl.NumberFormat('en-US', { style: 'currency', currency: selectedCharge.currency }).format(refundable)}`;
  };


  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Create a Refund</CardTitle>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
               <FormField
                control={form.control}
                name="chargeId"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>Charge to Refund</FormLabel>
                    <Popover>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            variant="outline"
                            role="combobox"
                            className={cn(
                              "w-full justify-between",
                              !field.value && "text-muted-foreground"
                            )}
                          >
                            {field.value
                              ? refundableCharges.find(
                                  (charge) => charge.id === field.value
                                )?.id
                              : "Select a charge..."}
                            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent className="w-[var(--radix-popover-trigger-width)] max-h-[--radix-popover-content-available-height] p-0">
                        <Command>
                          <CommandInput placeholder="Search charge ID..." />
                           <CommandList>
                          <CommandEmpty>No refundable charges found.</CommandEmpty>
                          <CommandGroup>
                            {refundableCharges.map((charge) => (
                              <CommandItem
                                value={charge.id}
                                key={charge.id}
                                onSelect={() => {
                                  form.setValue("chargeId", charge.id);
                                }}
                              >
                                <Check
                                  className={cn(
                                    "mr-2 h-4 w-4",
                                    charge.id === field.value
                                      ? "opacity-100"
                                      : "opacity-0"
                                  )}
                                />
                                <div className="flex flex-col">
                                  <span>{charge.id}</span>
                                  <span className="text-xs text-muted-foreground">
                                    Amount: {new Intl.NumberFormat('en-US', { style: 'currency', currency: charge.currency }).format(charge.amount / 100)} - {charge.description || 'No description'}
                                  </span>
                                </div>
                              </CommandItem>
                            ))}
                          </CommandGroup>
                          </CommandList>
                        </Command>
                      </PopoverContent>
                    </Popover>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="amount"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Amount</FormLabel>
                    <FormControl>
                      <Input type="number" step="0.01" placeholder="e.g., 20.00" {...field} disabled={!selectedCharge} />
                    </FormControl>
                    <FormDescription>
                      {getRefundableAmountText()}
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="reason"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Reason</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select a reason (optional)" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="duplicate">Duplicate</SelectItem>
                        <SelectItem value="fraudulent">Fraudulent</SelectItem>
                        <SelectItem value="requested_by_customer">Requested by customer</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <Button type="submit">Create Refund</Button>
            </form>
          </Form>
        </CardContent>
      </Card>
      
      {createdRefund && (
        <div className="space-y-4">
          <h3 className="text-lg font-medium">Mock API Response</h3>
          <NexusResourceJSON resource={createdRefund} />
        </div>
      )}
    </div>
  );
};

export default RefundForm;
