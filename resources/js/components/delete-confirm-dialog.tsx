import React from 'react';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { AlertTriangle, Trash2 } from 'lucide-react';

interface DeleteConfirmDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    title?: string;
    description?: string;
    itemName?: string;
    confirmLabel?: string;
    cancelLabel?: string;
    onConfirm: () => void;
    isDeleting?: boolean;
}

export function DeleteConfirmDialog({
    open,
    onOpenChange,
    title = 'Confirm Deletion',
    description = 'Are you sure you want to delete this record? This action cannot be undone and will permanently remove the item.',
    itemName,
    confirmLabel = 'Delete Record',
    cancelLabel = 'Cancel',
    onConfirm,
    isDeleting = false,
}: DeleteConfirmDialogProps) {
    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[420px] p-6 rounded-2xl border-border bg-card">
                <div className="flex flex-col items-center text-center sm:items-start sm:text-left gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-rose-500/15 text-rose-600 dark:text-rose-400 flex items-center justify-center shrink-0">
                        <AlertTriangle className="w-6 h-6" />
                    </div>

                    <div className="space-y-1.5 w-full">
                        <DialogHeader>
                            <DialogTitle className="text-lg font-black text-foreground">
                                {title}
                            </DialogTitle>
                            <DialogDescription className="text-xs text-muted-foreground leading-relaxed pt-1">
                                {description}
                                {itemName && (
                                    <span className="block mt-2 p-2.5 rounded-xl bg-muted/50 border border-border/80 font-bold text-foreground text-xs text-left truncate">
                                        "{itemName}"
                                    </span>
                                )}
                            </DialogDescription>
                        </DialogHeader>
                    </div>
                </div>

                <DialogFooter className="mt-4 flex flex-col-reverse sm:flex-row gap-2 sm:justify-end">
                    <Button
                        type="button"
                        variant="outline"
                        onClick={() => onOpenChange(false)}
                        disabled={isDeleting}
                        className="rounded-xl border-border text-xs font-bold w-full sm:w-auto h-9"
                    >
                        {cancelLabel}
                    </Button>
                    <Button
                        type="button"
                        variant="destructive"
                        onClick={() => {
                            onConfirm();
                        }}
                        disabled={isDeleting}
                        className="rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold w-full sm:w-auto h-9 gap-1.5 shadow-xs"
                    >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>{isDeleting ? 'Deleting...' : confirmLabel}</span>
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}

export default DeleteConfirmDialog;
