import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Card,
  CardHeader,
  CardBody,
  CardFooter,
  Typography,
  Button,
  Dialog,
  DialogHeader,
  DialogBody,
  DialogFooter,
  Input,
  Select,
  Option,
  Spinner,
  Alert,
} from '@material-tailwind/react';
import {
  PencilIcon,
  TrashIcon,
  CalendarIcon,
  DocumentTextIcon,
  ArrowLeftIcon,
} from '@heroicons/react/24/outline';

// Assume these are your API service functions
import {
  getSubscriptionById,
  updateSubscription,
  cancelSubscription,
  getSubscriptionHistory,
  getUpcomingInvoices,
  pauseSubscription,
  resumeSubscription,
} from '../../../services/stripeService';
import { Subscription, Invoice, SubscriptionHistoryEvent } from '../../../types/stripeTypes';

const SubscriptionDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [history, setHistory] = useState<SubscriptionHistoryEvent[]>([]);
  const [upcomingInvoices, setUpcomingInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Edit modal state
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editedSubscription, setEditedSubscription] = useState<Partial<Subscription>>({});
  const [isSaving, setIsSaving] = useState(false);

  // Cancel modal state
  const [isCancelModalOpen, setIsCancelModalOpen] = useState(false);
  const [cancelReason, setCancelReason] = useState('');
  const [isCanceling, setIsCanceling] = useState(false);

  // Pause modal state
  const [isPauseModalOpen, setIsPauseModalOpen] = useState(false);
  const [pauseUntil, setPauseUntil] = useState<string>(''); // YYYY-MM-DD format
  const [isPausing, setIsPausing] = useState(false);

  useEffect(() => {
    const fetchSubscriptionDetails = async () => {
      if (!id) {
        setError('Subscription ID is missing.');
        setLoading(false);
        return;
      }
      try {
        setLoading(true);
        setError(null);
        const sub = await getSubscriptionById(id);
        setSubscription(sub);
        setEditedSubscription({
          status: sub.status,
          billing_cycle_anchor: sub.billing_cycle_anchor ? new Date(sub.billing_cycle_anchor * 1000).toISOString().split('T')[0] : '',
          cancel_at_period_end: sub.cancel_at_period_end,
          // Add other editable fields as needed
        });

        const hist = await getSubscriptionHistory(id);
        setHistory(hist);

        const invoices = await getUpcomingInvoices(id);
        setUpcomingInvoices(invoices);
      } catch (err: any) {
        setError(`Failed to load subscription details: ${err.message}`);
        console.error('Error fetching subscription details:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchSubscriptionDetails();
  }, [id]);

  const handleEditOpen = () => {
    if (subscription) {
      setEditedSubscription({
        status: subscription.status,
        billing_cycle_anchor: subscription.billing_cycle_anchor ? new Date(subscription.billing_cycle_anchor * 1000).toISOString().split('T')[0] : '',
        cancel_at_period_end: subscription.cancel_at_period_end,
        // Initialize other fields
      });
      setIsEditModalOpen(true);
    }
  };

  const handleEditClose = () => {
    setIsEditModalOpen(false);
    setEditedSubscription({});
  };

  const handleSaveEdit = async () => {
    if (!subscription || !id) return;
    setIsSaving(true);
    setError(null);
    try {
      // Prepare update data, only send fields that have changed and are updatable
      const updateData: any = {};
      if (editedSubscription.status !== subscription.status && editedSubscription.status) {
        updateData.status = editedSubscription.status;
      }
      if (editedSubscription.billing_cycle_anchor) {
        const newAnchorTimestamp = new Date(editedSubscription.billing_cycle_anchor).getTime() / 1000;
        if (subscription.billing_cycle_anchor !== newAnchorTimestamp) {
          updateData.billing_cycle_anchor = Math.floor(newAnchorTimestamp);
        }
      }
      if (editedSubscription.cancel_at_period_end !== subscription.cancel_at_period_end) {
        updateData.cancel_at_period_end = editedSubscription.cancel_at_period_end;
      }

      if (Object.keys(updateData).length > 0) {
        const updatedSub = await updateSubscription(id, updateData);
        setSubscription(updatedSub);
        // Refresh other data if necessary
        const hist = await getSubscriptionHistory(id);
        setHistory(hist);
        const invoices = await getUpcomingInvoices(id);
        setUpcomingInvoices(invoices);
      }
      handleEditClose();
    } catch (err: any) {
      setError(`Failed to save changes: ${err.message}`);
      console.error('Error saving subscription edits:', err);
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancelOpen = () => {
    setIsCancelModalOpen(true);
  };

  const handleCancelClose = () => {
    setIsCancelModalOpen(false);
    setCancelReason('');
  };

  const handleConfirmCancel = async () => {
    if (!subscription || !id) return;
    setIsCanceling(true);
    setError(null);
    try {
      await cancelSubscription(id, { reason: cancelReason });
      // Update local state to reflect cancellation
      setSubscription((prev) => prev ? { ...prev, status: 'canceled' } : null);
      handleCancelClose();
      // Optionally refresh history
      const hist = await getSubscriptionHistory(id);
      setHistory(hist);
    } catch (err: any) {
      setError(`Failed to cancel subscription: ${err.message}`);
      console.error('Error canceling subscription:', err);
    } finally {
      setIsCanceling(false);
    }
  };

  const handlePauseOpen = () => {
    if (subscription?.status === 'active') {
      setIsPauseModalOpen(true);
    } else {
      setError('Only active subscriptions can be paused.');
    }
  };

  const handlePauseClose = () => {
    setIsPauseModalOpen(false);
    setPauseUntil('');
  };

  const handleConfirmPause = async () => {
    if (!subscription || !id || !pauseUntil) return;
    setIsPausing(true);
    setError(null);
    try {
      const pauseDate = new Date(pauseUntil);
      const pauseTimestamp = Math.floor(pauseDate.getTime() / 1000);
      await pauseSubscription(id, { pause_until: pauseTimestamp });
      setSubscription((prev) => prev ? { ...prev, status: 'paused' } : null); // Assuming API returns updated status
      handlePauseClose();
      // Optionally refresh history
      const hist = await getSubscriptionHistory(id);
      setHistory(hist);
    } catch (err: any) {
      setError(`Failed to pause subscription: ${err.message}`);
      console.error('Error pausing subscription:', err);
    } finally {
      setIsPausing(false);
    }
  };

  const handleResume = async () => {
    if (!subscription || !id) return;
    setLoading(true); // Use loading state for resume action
    setError(null);
    try {
      await resumeSubscription(id);
      setSubscription((prev) => prev ? { ...prev, status: 'active' } : null); // Assuming API returns updated status
      // Optionally refresh history
      const hist = await getSubscriptionHistory(id);
      setHistory(hist);
      const invoices = await getUpcomingInvoices(id);
      setUpcomingInvoices(invoices);
    } catch (err: any) {
      setError(`Failed to resume subscription: ${err.message}`);
      console.error('Error resuming subscription:', err);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (timestamp: number | undefined) => {
    if (!timestamp) return 'N/A';
    return new Date(timestamp * 1000).toLocaleDateString();
  };

  const formatCurrency = (amount: number | undefined, currency: string | undefined) => {
    if (amount === undefined || !currency) return 'N/A';
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: currency.toUpperCase() }).format(amount / 100);
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <Spinner className="h-16 w-16" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-8">
        <Alert color="red">{error}</Alert>
        <Button onClick={() => navigate(-1)} className="mt-4">
          <ArrowLeftIcon className="h-4 w-4 mr-2" /> Go Back
        </Button>
      </div>
    );
  }

  if (!subscription) {
    return (
      <div className="p-8">
        <Alert color="yellow">Subscription not found.</Alert>
        <Button onClick={() => navigate(-1)} className="mt-4">
          <ArrowLeftIcon className="h-4 w-4 mr-2" /> Go Back
        </Button>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-8">
      <Button onClick={() => navigate(-1)} variant="text" className="mb-6 flex items-center gap-2">
        <ArrowLeftIcon className="h-4 w-4" /> Back to Subscriptions
      </Button>

      <Card className="mb-8">
        <CardHeader floated={false} shadow={false} className="rounded-none">
          <div className="mb-4 flex items-center justify-between gap-8">
            <div>
              <Typography variant="h5" color="blue-gray">
                Subscription Details
              </Typography>
              <Typography color="gray" className="mt-1 font-normal">
                ID: {subscription.id}
              </Typography>
            </div>
            <div className="flex shrink-0 flex-wrap gap-2">
              <Button onClick={handleEditOpen} variant="outlined" className="flex items-center gap-2">
                <PencilIcon strokeWidth={2} className="h-4 w-4" /> Edit
              </Button>
              {subscription.status === 'active' && (
                <>
                  <Button onClick={handlePauseOpen} color="blue" className="flex items-center gap-2">
                    <CalendarIcon strokeWidth={2} className="h-4 w-4" /> Pause
                  </Button>
                  <Button onClick={handleCancelOpen} color="red" className="flex items-center gap-2">
                    <TrashIcon strokeWidth={2} className="h-4 w-4" /> Cancel
                  </Button>
                </>
              )}
              {subscription.status === 'paused' && (
                <Button onClick={handleResume} color="green" className="flex items-center gap-2">
                  <CalendarIcon strokeWidth={2} className="h-4 w-4" /> Resume
                </Button>
              )}
              {/* Add other actions like 'Resend Invoice', 'Change Plan' etc. */}
            </div>
          </div>
        </CardHeader>
        <CardBody className="overflow-x-auto px-0 pt-0">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Typography variant="h6" color="blue-gray" className="mb-2">
                Customer Information
              </Typography>
              <Typography>Name: {subscription.customer?.name || 'N/A'}</Typography>
              <Typography>Email: {subscription.customer?.email || 'N/A'}</Typography>
              <Typography>Customer ID: {subscription.customer?.id || 'N/A'}</Typography>
            </div>
            <div>
              <Typography variant="h6" color="blue-gray" className="mb-2">
                Subscription Details
              </Typography>
              <Typography>Status: <span className={`font-bold ${subscription.status === 'active' ? 'text-green-500' : subscription.status === 'canceled' ? 'text-red-500' : 'text-blue-500'}`}>{subscription.status.charAt(0).toUpperCase() + subscription.status.slice(1)}</span></Typography>
              <Typography>Plan: {subscription.items?.data[0]?.price?.product?.name || 'N/A'}</Typography>
              <Typography>Price: {formatCurrency(subscription.items?.data[0]?.price?.unit_amount, subscription.currency)}</Typography>
              <Typography>Interval: {subscription.items?.data[0]?.price?.recurring?.interval || 'N/A'}</Typography>
              <Typography>Next Billing Date: {formatDate(subscription.current_period_end)}</Typography>
              <Typography>Created: {formatDate(subscription.created)}</Typography>
              <Typography>Cancel at Period End: {subscription.cancel_at_period_end ? 'Yes' : 'No'}</Typography>
              {subscription.pause_collection?.end_behavior === 'mark_unpaid' && (
                <Typography>Paused until: {formatDate(subscription.pause_collection?.unpause_at)}</Typography>
              )}
            </div>
          </div>
        </CardBody>
      </Card>

      {/* Upcoming Invoices Section */}
      <Card className="mb-8">
        <CardHeader floated={false} shadow={false} className="rounded-none">
          <Typography variant="h5" color="blue-gray">
            Upcoming Invoices
          </Typography>
        </CardHeader>
        <CardBody className="overflow-x-auto px-0 pt-0">
          {upcomingInvoices.length > 0 ? (
            <table className="w-full min-w-max table-auto text-left">
              <thead>
                <tr>
                  <th className="border-y border-blue-gray-100 bg-blue-gray-50/50 p-4">
                    <Typography variant="small" color="blue-gray" className="font-normal leading-none">
                      Invoice ID
                    </Typography>
                  </th>
                  <th className="border-y border-blue-gray-100 bg-blue-gray-50/50 p-4">
                    <Typography variant="small" color="blue-gray" className="font-normal leading-none">
                      Status
                    </Typography>
                  </th>
                  <th className="border-y border-blue-gray-100 bg-blue-gray-50/50 p-4">
                    <Typography variant="small" color="blue-gray" className="font-normal leading-none">
                      Due Date
                    </Typography>
                  </th>
                  <th className="border-y border-blue-gray-100 bg-blue-gray-50/50 p-4">
                    <Typography variant="small" color="blue-gray" className="font-normal leading-none">
                      Amount
                    </Typography>
                  </th>
                  <th className="border-y border-blue-gray-100 bg-blue-gray-50/50 p-4">
                    <Typography variant="small" color="blue-gray" className="font-normal leading-none">
                      Actions
                    </Typography>
                  </th>
                </tr>
              </thead>
              <tbody>
                {upcomingInvoices.map((invoice) => (
                  <tr key={invoice.id}>
                    <td className="p-4 border-b border-blue-gray-50">
                      <Typography variant="small" color="blue-gray" className="font-normal">
                        {invoice.id}
                      </Typography>
                    </td>
                    <td className="p-4 border-b border-blue-gray-50">
                      <Typography variant="small" color="blue-gray" className="font-normal">
                        {invoice.status}
                      </Typography>
                    </td>
                    <td className="p-4 border-b border-blue-gray-50">
                      <Typography variant="small" color="blue-gray" className="font-normal">
                        {formatDate(invoice.due_date)}
                      </Typography>
                    </td>
                    <td className="p-4 border-b border-blue-gray-50">
                      <Typography variant="small" color="blue-gray" className="font-normal">
                        {formatCurrency(invoice.amount_due, invoice.currency)}
                      </Typography>
                    </td>
                    <td className="p-4 border-b border-blue-gray-50">
                      <Button
                        variant="text"
                        size="sm"
                        onClick={() => window.open(invoice.hosted_invoice_url || '#', '_blank')}
                        disabled={!invoice.hosted_invoice_url}
                      >
                        View Invoice
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <Typography className="p-4 text-center text-gray-500">No upcoming invoices found.</Typography>
          )}
        </CardBody>
      </Card>

      {/* Subscription History Section */}
      <Card>
        <CardHeader floated={false} shadow={false} className="rounded-none">
          <Typography variant="h5" color="blue-gray">
            Subscription History
          </Typography>
        </CardHeader>
        <CardBody className="overflow-x-auto px-0 pt-0">
          {history.length > 0 ? (
            <table className="w-full min-w-max table-auto text-left">
              <thead>
                <tr>
                  <th className="border-y border-blue-gray-100 bg-blue-gray-50/50 p-4">
                    <Typography variant="small" color="blue-gray" className="font-normal leading-none">
                      Timestamp
                    </Typography>
                  </th>
                  <th className="border-y border-blue-gray-100 bg-blue-gray-50/50 p-4">
                    <Typography variant="small" color="blue-gray" className="font-normal leading-none">
                      Type
                    </Typography>
                  </th>
                  <th className="border-y border-blue-gray-100 bg-blue-gray-50/50 p-4">
                    <Typography variant="small" color="blue-gray" className="font-normal leading-none">
                      Details
                    </Typography>
                  </th>
                </tr>
              </thead>
              <tbody>
                {history.map((event) => (
                  <tr key={event.id}>
                    <td className="p-4 border-b border-blue-gray-50">
                      <Typography variant="small" color="blue-gray" className="font-normal">
                        {formatDate(event.created)}
                      </Typography>
                    </td>
                    <td className="p-4 border-b border-blue-gray-50">
                      <Typography variant="small" color="blue-gray" className="font-normal">
                        {event.type}
                      </Typography>
                    </td>
                    <td className="p-4 border-b border-blue-gray-50">
                      <Typography variant="small" color="blue-gray" className="font-normal">
                        {event.data?.object?.description || 'N/A'}
                      </Typography>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <Typography className="p-4 text-center text-gray-500">No history found.</Typography>
          )}
        </CardBody>
      </Card>

      {/* Edit Subscription Modal */}
      <Dialog open={isEditModalOpen} handler={handleEditClose} size="lg">
        <DialogHeader>Edit Subscription</DialogHeader>
        <DialogBody divider>
          {error && <Alert color="red" className="mb-4">{error}</Alert>}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Typography variant="h6" color="blue-gray" className="mb-2">
                Subscription Status
              </Typography>
              <Select
                label="Status"
                value={editedSubscription.status || ''}
                onChange={(e) => setEditedSubscription({ ...editedSubscription, status: e as any })}
                disabled={subscription.status === 'canceled'} // Cannot edit status if already canceled
              >
                <Option value="active">Active</Option>
                <Option value="paused">Paused</Option>
                {/* Add other relevant statuses if applicable */}
              </Select>
            </div>
            <div>
              <Typography variant="h6" color="blue-gray" className="mb-2">
                Billing Cycle Anchor
              </Typography>
              <Input
                type="date"
                label="Billing Cycle Anchor"
                value={editedSubscription.billing_cycle_anchor || ''}
                onChange={(e) => setEditedSubscription({ ...editedSubscription, billing_cycle_anchor: e.target.value })}
                className="!border-blue-gray-200 focus:!border-blue-500"
                labelProps={{ className: "!text-blue-gray-400" }}
              />
            </div>
            <div>
              <Typography variant="h6" color="blue-gray" className="mb-2">
                Cancel at Period End
              </Typography>
              <Select
                label="Cancel at Period End"
                value={editedSubscription.cancel_at_period_end ? 'true' : 'false'}
                onChange={(e) => setEditedSubscription({ ...editedSubscription, cancel_at_period_end: e === 'true' })}
              >
                <Option value="true">Yes</Option>
                <Option value="false">No</Option>
              </Select>
            </div>
            {/* Add more editable fields here */}
          </div>
        </DialogBody>
        <DialogFooter>
          <Button variant="text" color="red" onClick={handleEditClose} className="mr-1">
            Cancel
          </Button>
          <Button variant="gradient" color="green" onClick={handleSaveEdit} disabled={isSaving}>
            {isSaving ? <Spinner className="h-4 w-4" /> : 'Save Changes'}
          </Button>
        </DialogFooter>
      </Dialog>

      {/* Cancel Subscription Modal */}
      <Dialog open={isCancelModalOpen} handler={handleCancelClose} size="sm">
        <DialogHeader>Confirm Cancellation</DialogHeader>
        <DialogBody divider>
          <Typography>Are you sure you want to cancel this subscription?</Typography>
          <Input
            label="Reason for Cancellation (Optional)"
            value={cancelReason}
            onChange={(e) => setCancelReason(e.target.value)}
            className="mt-4 !border-blue-gray-200 focus:!border-blue-500"
            labelProps={{ className: "!text-blue-gray-400" }}
          />
        </DialogBody>
        <DialogFooter>
          <Button variant="text" color="gray" onClick={handleCancelClose} className="mr-1">
            No, Keep it
          </Button>
          <Button variant="gradient" color="red" onClick={handleConfirmCancel} disabled={isCanceling}>
            {isCanceling ? <Spinner className="h-4 w-4" /> : 'Yes, Cancel'}
          </Button>
        </DialogFooter>
      </Dialog>

      {/* Pause Subscription Modal */}
      <Dialog open={isPauseModalOpen} handler={handlePauseClose} size="sm">
        <DialogHeader>Pause Subscription</DialogHeader>
        <DialogBody divider>
          <Typography>When would you like to pause the subscription until?</Typography>
          <Input
            type="date"
            label="Pause Until"
            value={pauseUntil}
            onChange={(e) => setPauseUntil(e.target.value)}
            className="mt-4 !border-blue-gray-200 focus:!border-blue-500"
            labelProps={{ className: "!text-blue-gray-400" }}
          />
          <Typography variant="small" color="gray" className="mt-2">
            The subscription will resume automatically on the date selected.
          </Typography>
        </DialogBody>
        <DialogFooter>
          <Button variant="text" color="gray" onClick={handlePauseClose} className="mr-1">
            Cancel
          </Button>
          <Button variant="gradient" color="blue" onClick={handleConfirmPause} disabled={isPausing || !pauseUntil}>
            {isPausing ? <Spinner className="h-4 w-4" /> : 'Pause Subscription'}
          </Button>
        </DialogFooter>
      </Dialog>
    </div>
  );
};

export default SubscriptionDetailPage;