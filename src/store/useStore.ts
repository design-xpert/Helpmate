import { create } from "zustand";
import { persist } from "zustand/middleware";
import { toast } from "@/components/common/Toast";
import { getCurrentCustomerApi } from "@/services/authApi";
import {
  addToCartApi,
  getCartApi,
  updateCartItemApi,
  removeCartItemApi,
  clearCartApi,
  updateCartAddonApi,
  ApiCartPricing,
} from "@/services/cartApi";
import {
  getCustomerAddressesApi,
  addCustomerAddressApi,
  updateCustomerAddressApi,
  deleteCustomerAddressApi,
  mapBackendAddressToFrontend,
  mapRelationshipToBackend,
  CreateAddressPayload,
  UpdateAddressPayload,
} from "@/services/addressApi";
import {
  getBookmarksApi,
  addBookmarkApi,
  removeBookmarkApi,
  toggleBookmarkApi,
  BookmarkItem,
} from "@/services/bookmarkApi";
import { createBookingApi, fetchCustomerBookingsApi, CreateBookingPayload } from "@/services/bookingApi";
import {
  createReviewApi,
  updateReviewApi,
  deleteReviewApi,
  fetchCustomerReviewsApi,
  CreateReviewPayload,
  UpdateReviewPayload,
} from "@/services/reviewApi";
import { formatImageUrl } from "@/utils/image";
import { isTokenExpired, isAuthError, handleTokenExpiration } from "@/utils/token";
export interface CartAddon {
  id?: string;
  _id?: string;
  name?: string;
  addonName?: string;
  price: number;
  description?: string;
  imageUrl?: string;
  image?: string;
  unit?: string;
  packageId?: string;
  packageName?: string;
}

export interface CartItem {
  id: string;
  itemId?: string;
  packageId?: string;
  name: string;
  price: number;
  quantity: number;
  category: string;
  duration: number; // in mins
  image?: string;
  imageUrl?: string;
  availableAddons?: CartAddon[];
  review?: {
    reviewId?: string;
    rating: number;
    comment?: string;
    dateCreated?: string;
  } | null;
  selectedAddons?: Array<{
    addonId: string;
    addonName: string;
    price: number;
    quantity: number;
    totalPrice: number;
    image?: string;
    imageUrl?: string;
  }>;
}

export const getItemAddonTotal = (item: CartItem): number => {
  if (!item.selectedAddons || item.selectedAddons.length === 0) return 0;
  return item.selectedAddons.reduce(
    (sum, a) => sum + (a.totalPrice || ((a.price || 0) * (a.quantity || 1))),
    0
  );
};

export const extractStoredCartAddons = (
  cart: CartItem[],
  packageAddonsMap: Record<string, CartAddon[]> = {}
): any[] => {
  if (!cart || cart.length === 0) return [];
  const matchedAddons: any[] = [];
  const seenAddonKeys = new Set<string>();

  cart.forEach((c) => {
    const rawId = c.packageId || c.itemId || c.id;
    const hexMatch = String(rawId).match(/[0-9a-fA-F]{24}/);
    const hex = hexMatch ? hexMatch[0] : rawId;
    const pName = c.name;

    // Check item's direct availableAddons, or store's packageAddonsMap
    const rawAddons =
      (c.availableAddons && c.availableAddons.length > 0 ? c.availableAddons : null) ||
      (c as any).addons ||
      (hex && packageAddonsMap[hex]) ||
      (rawId && packageAddonsMap[rawId]) ||
      [];

    if (Array.isArray(rawAddons)) {
      rawAddons.forEach((addon: any) => {
        const aId = String(addon._id || addon.id || addon.addonId || "");
        const aKey = `${hex || rawId}-${aId}`;
        if (aId && !seenAddonKeys.has(aKey)) {
          seenAddonKeys.add(aKey);
          matchedAddons.push({
            id: aId,
            packageId: hex || rawId,
            packageName: pName,
            name: addon.addonName || addon.title || addon.name || "Service Add-on",
            price: typeof addon.price === "number" ? addon.price : Number(addon.price) || 0,
            description: addon.description || "",
            imageUrl: addon.imageUrl || addon.image ? formatImageUrl(addon.imageUrl || addon.image) : `/api/media/addon/${aId}/image`,
          });
        }
      });
    }
  });

  return matchedAddons;
};

export const calculateGuestPricing = (cartItems: CartItem[]): ApiCartPricing => {
  const itemsSubtotal = cartItems.reduce((sum, item) => sum + (item.price * (item.quantity || 1)), 0);
  const addonSubtotal = cartItems.reduce((sum, item) => sum + getItemAddonTotal(item), 0);
  const subtotal = itemsSubtotal + addonSubtotal;
  const gstRate = 18;
  const gst = 0;
  const convenienceFee = subtotal > 0 ? 49 : 0;
  const grandTotal = subtotal + gst + convenienceFee;
  return {
    itemsSubtotal,
    addonSubtotal,
    subtotal,
    gstRate,
    gst,
    convenienceFee,
    grandTotal,
  };
};

const syncGuestCartToServer = async (guestCart: CartItem[], userToken: string) => {
  if (!userToken || guestCart.length === 0) return;
  try {
    for (const item of guestCart) {
      const rawPkgId = item.packageId || item.id || item.itemId;
      const hexMatch = String(rawPkgId).match(/[0-9a-fA-F]{24}/);
      const packageId = hexMatch ? hexMatch[0] : rawPkgId;
      if (packageId) {
        const addRes = await addToCartApi(userToken, packageId, item.quantity || 1);
        if (item.selectedAddons && item.selectedAddons.length > 0) {
          let serverItemId: string | undefined;
          if (addRes?.success && addRes.data?.cart?.items) {
            const serverItem = addRes.data.cart.items.find((si: any) =>
              String(si.packageId?._id || si.packageId) === String(packageId)
            );
            serverItemId = serverItem?._id || serverItem?.itemId;
          }
          if (serverItemId) {
            for (const addon of item.selectedAddons) {
              if (addon.addonId) {
                await updateCartAddonApi(userToken, serverItemId, addon.addonId, "add");
              }
            }
          }
        }
      }
    }
  } catch (err) {
    console.error("Error syncing guest cart items to server:", err);
  }
};

export type AddressRecipientType = "Self" | "Family Member" | "Friend / Neighbor" | "Office / Work" | "Other";

export interface Address {
  id: string;
  tag: string;
  recipientType?: AddressRecipientType;
  recipientName?: string;
  recipientPhone?: string;
  recipientMobile?: string;
  locality?: string;
  localityId?: string;
  pincode?: string;
  houseNo?: string;
  landmark?: string;
  addressLine: string;
  city: string;
  isDefault?: boolean;
}

export const varanasiLocalities = [
  { id: "loc-1", name: "Sigra", pincode: "221002" },
  { id: "loc-2", name: "Lanka / Assi Ghat", pincode: "221005" },
  { id: "loc-3", name: "Godowlia", pincode: "221001" },
  { id: "loc-4", name: "Bhelupur", pincode: "221010" },
  { id: "loc-5", name: "Mahmoorganj", pincode: "221010" },
  { id: "loc-6", name: "Shivpur", pincode: "221003" },
  { id: "loc-7", name: "Sarnath", pincode: "221007" },
  { id: "loc-8", name: "Varanasi Cantt / Nadesar", pincode: "221002" },
  { id: "loc-9", name: "Lahurabir", pincode: "221001" },
  { id: "loc-10", name: "Rathyatra", pincode: "221010" },
];

export interface Booking {
  id: string;
  bookingNumber?: string;
  items: CartItem[];
  address: Address;
  date: string;
  timeSlot: string;
  totalAmount: number;
  discount: number;
  finalAmount: number;
  status: "Pending" | "Assigned" | "In-Transit" | "Arrived" | "In-Progress" | "Completed" | "Cancelled";
  professional?: {
    name: string;
    rating: number;
    completedJobs: number;
    avatar: string;
    phone: string;
    eta?: string;
  };
  otp: string;
  timeline: { status: string; time: string; done: boolean }[];
  invoiceId: string;
  dateCreated: string;
  review?: {
    reviewId?: string;
    rating: number;
    comment?: string;
    dateCreated?: string;
  };
}

export interface ChatMessage {
  id: string;
  sender: "user" | "bot" | "partner";
  text: string;
  timestamp: string;
}

interface AppState {
  // Theme
  theme: "light" | "dark";
  toggleTheme: () => void;

  // Auth & Profile
  token: string | null;
  customerId: string | null;
  customerCode: string | null;
  isLoggedIn: boolean;
  guestMode: boolean;
  setGuestMode: (val: boolean) => void;
  userPhone: string;
  userName: string;
  walletBalance: number;
  loyaltyPoints: number;
  addresses: Address[];
  addAddress: (address: Omit<Address, "id">) => void;
  removeAddress: (id: string) => void;
  fetchAddresses: () => Promise<void>;
  addAddressAsync: (address: Omit<Address, "id"> & { localityId?: string }) => Promise<boolean>;
  updateAddressAsync: (id: string, address: Partial<Address> & { localityId?: string }) => Promise<boolean>;
  removeAddressAsync: (id: string) => Promise<boolean>;

  // Bookmarks / Saved Packages
  bookmarkedPackageIds: string[];
  bookmarkedPackages: BookmarkItem[];
  fetchBookmarks: () => Promise<void>;
  toggleBookmark: (packageId: string) => Promise<boolean>;
  isBookmarked: (packageId: string) => boolean;

  login: (phone: string, token?: string, customer?: any) => void;
  setAuth: (data: { token: string; customer: { id: string; customerCode: string; fullName: string; mobile: string } }) => void;
  fetchCustomerProfile: () => Promise<void>;
  logout: () => void;

  // Membership Benefits
  isMember: boolean;
  membershipTier: "VIP Pass" | "Helpmate Club Plus" | "Club Plus" | null;
  membershipExpiry: string | null;
  freeServicesAvailable: number;
  totalMembershipSavings: number;
  buyMembership: (tier?: "VIP Pass" | "Helpmate Club Plus" | "Club Plus") => void;
  toggleMembership: () => void;
  claimFreeService: () => void;

  // Cart
  cart: CartItem[];
  cartId: string | null;
  cartPricing: ApiCartPricing | null;
  packageAddonsMap: Record<string, CartAddon[]>;
  setPackageAddons: (packageId: string, addons: any[], packageName?: string) => void;
  fetchServerCart: () => Promise<void>;
  addToCart: (item: (Omit<CartItem, "quantity"> | CartItem) & { addons?: any[]; availableAddons?: any[]; selectedAddons?: any[] }, quantityOverride?: number) => Promise<void>;
  removeFromCart: (id: string) => Promise<void>;
  updateCartQuantity: (id: string, quantity: number) => Promise<void>;
  clearCart: () => Promise<void>;
  toggleAddonInCart: (itemId: string, addonId: string, action: "add" | "remove", addonDetails?: { addonName?: string; price?: number; imageUrl?: string; image?: string }) => Promise<void>;

  // Location & Booking details
  selectedLocation: string;
  setSelectedLocation: (loc: string) => void;
  locationPermissionDenied: boolean;
  setLocationPermissionDenied: (denied: boolean) => void;
  hasPromptedLocation: boolean;
  setHasPromptedLocation: (prompted: boolean) => void;
  isLocationSet: boolean;
  setIsLocationSet: (val: boolean) => void;
  isOutOfServiceZone: boolean;
  setIsOutOfServiceZone: (val: boolean) => void;
  selectedAddressId: string | null;
  setSelectedAddressId: (id: string | null) => void;
  selectedDate: string | null;
  setSelectedDate: (date: string | null) => void;
  selectedTimeSlot: string | null;
  setSelectedTimeSlot: (slot: string | null) => void;
  appliedCoupon: string | null;
  applyCoupon: (code: string) => boolean;
  removeCoupon: () => void;

  // Bookings list
  bookings: Booking[];
  isLoadingBookings: boolean;
  isLoadingAddresses: boolean;
  isLoadingBookmarks: boolean;
  fetchBookings: () => Promise<void>;
  createBooking: () => Booking | null;
  createBookingAsync: (paymentMethod?: string) => Promise<{ success: boolean; message: string; booking?: Booking }>;
  cancelBooking: (id: string) => void;
  rescheduleBooking: (id: string, date: string, slot: string) => void;
  updateBookingStatus: (id: string, status: Booking["status"]) => void;

  // Reviews
  createReviewAsync: (payload: CreateReviewPayload) => Promise<{ success: boolean; message: string; data?: any }>;
  updateReviewAsync: (reviewId: string, payload: UpdateReviewPayload) => Promise<{ success: boolean; message: string; data?: any }>;
  deleteReviewAsync: (reviewId: string) => Promise<{ success: boolean; message: string }>;
  fetchPackageReviewsAsync: (packageId?: string) => Promise<{ success: boolean; message: string; data?: any }>;
  attachReviewToBooking: (bookingId: string, review: { reviewId?: string; rating: number; comment?: string; dateCreated?: string } | null, packageId?: string) => void;



  // Wishlist / History
  wishlist: string[];
  toggleWishlist: (id: string) => void;
  recentlyViewed: string[];
  addToRecentlyViewed: (id: string) => void;
  seedMockBookings: () => void;

  // Notifications
  notifications: { id: string; title: string; message: string; type: "info" | "success" | "warning" | "error"; date: string }[];
  addNotification: (title: string, message: string, type?: "info" | "success" | "warning" | "error") => void;
  clearNotifications: () => void;

  // Live Chat
  chatOpen: boolean;
  setChatOpen: (open: boolean) => void;
  chatMessages: ChatMessage[];
  sendChatMessage: (text: string, sender?: "user" | "bot" | "partner") => void;
  updateProfile: (name: string, phone: string) => void;
  addWalletFunds: (amount: number) => void;
  redeemLoyaltyPoints: (points: number) => void;
}

export const useStore = create<AppState>()(
  persist(
    (set, get) => ({
      // Theme
      theme: "light",
      toggleTheme: () => set((state) => ({ theme: state.theme === "light" ? "dark" : "light" })),

      // Profile State
      token: null,
      customerId: null,
      customerCode: null,
      isLoggedIn: false, // Defaulting logged out to prompt login/signup first
      guestMode: true,
      setGuestMode: (val) => set({ guestMode: val }),
      userPhone: "+91 98765 01928",
      userName: "Rohan Verma",
      walletBalance: 1250,
      loyaltyPoints: 340,
      addresses: [],
      isLoadingAddresses: false,
      isLoadingBookmarks: false,
      isLoadingBookings: false,
      fetchAddresses: async () => {
        const token = get().token;
        if (!token) return;
        if (isTokenExpired(token)) {
          handleTokenExpiration("Your session has expired. Please sign in again.");
          return;
        }
        set({ isLoadingAddresses: true });
        try {
          const res = await getCustomerAddressesApi(token);
          if (res.success && res.data) {
            const mapped = res.data.map(mapBackendAddressToFrontend);
            const seenAddrIds = new Set<string>();
            const uniqueMapped = mapped.filter((a) => {
              if (!a.id || seenAddrIds.has(a.id)) return false;
              seenAddrIds.add(a.id);
              return true;
            });
            const currentSelected = get().selectedAddressId;
            const stillValid = currentSelected ? uniqueMapped.some((a) => a.id === currentSelected) : false;
            set({ 
              addresses: uniqueMapped, 
              isLoadingAddresses: false,
              selectedAddressId: stillValid ? currentSelected : null
            });
          } else {
            set({ isLoadingAddresses: false });
            if (res && isAuthError(0, res.message)) {
              handleTokenExpiration(res.message);
            }
          }
        } catch (err: any) {
          console.error("Error fetching customer addresses:", err);
          set({ isLoadingAddresses: false });
          if (err && isAuthError(0, err?.message)) {
            handleTokenExpiration(err.message);
          }
        }
      },
      addAddress: (address) => {
        const token = get().token;
        if (token) {
          get().addAddressAsync(address).catch((err) => {
            console.error("Async add address error:", err);
            toast.error("Failed to Add Address", err?.message || "An unexpected error occurred.");
          });
        } else {
          const localId = Math.random().toString(36).substr(2, 9);
          const newAddress = { ...address, id: localId };
          set((state) => ({
            addresses: [newAddress, ...state.addresses],
            selectedAddressId: address.isDefault ? localId : (state.selectedAddressId || localId),
          }));
          toast.success("Address Saved", "Address registered for current booking session.");
        }
      },
      addAddressAsync: async (newAddr) => {
        const token = get().token;
        if (token) {
          const payload: CreateAddressPayload = {
            addressLabel: newAddr.tag || "Home",
            relationshipType: mapRelationshipToBackend(newAddr.recipientType),
            recipientName: newAddr.recipientName,
            recipientMobile: newAddr.recipientMobile || newAddr.recipientPhone,
            localityId: newAddr.localityId || "",
            pincode: newAddr.pincode || "221002",
            serviceAddress: newAddr.addressLine,
            landmark: newAddr.landmark || "",
            isPrimary: newAddr.isDefault || false,
          };

          try {
            const res = await addCustomerAddressApi(token, payload);
            if (res.success && res.data) {
              const frontendAddr = mapBackendAddressToFrontend(res.data);
              set((state) => ({
                addresses: [frontendAddr, ...state.addresses.filter((a) => a.id !== frontendAddr.id)],
                selectedAddressId: frontendAddr.isDefault ? frontendAddr.id : (state.selectedAddressId || frontendAddr.id),
              }));
              toast.success("Address Saved", "Delivery address added successfully.");
              return true;
            } else {
              console.error("Error adding address:", res.message);
              toast.error("Failed to Save Address", res.message || "Please check address details.");
              return false;
            }
          } catch (err: any) {
            console.error("Error adding address:", err);
            toast.error("Network Error", err.message || "Failed to reach server. Please try again.");
            return false;
          }
        } else {
          const localId = Math.random().toString(36).substr(2, 9);
          const frontendAddr: Address = { ...newAddr, id: localId };
          set((state) => ({
            addresses: [frontendAddr, ...state.addresses],
            selectedAddressId: frontendAddr.isDefault ? frontendAddr.id : (state.selectedAddressId || frontendAddr.id),
          }));
          toast.success("Address Saved", "Delivery address saved for this session.");
          return true;
        }
      },
      updateAddressAsync: async (id, updatedData) => {
        const token = get().token;
        if (token) {
          const payload: UpdateAddressPayload = {
            addressLabel: updatedData.tag,
            relationshipType: updatedData.recipientType ? mapRelationshipToBackend(updatedData.recipientType) : undefined,
            recipientName: updatedData.recipientName,
            recipientMobile: updatedData.recipientMobile || updatedData.recipientPhone,
            localityId: updatedData.localityId || "",
            pincode: updatedData.pincode || "221002",
            serviceAddress: updatedData.addressLine,
            landmark: updatedData.landmark || "",
            isPrimary: updatedData.isDefault,
          };

          try {
            const res = await updateCustomerAddressApi(token, id, payload);
            if (res.success && res.data) {
              const updatedFrontend = mapBackendAddressToFrontend(res.data);
              set((state) => ({
                addresses: [updatedFrontend, ...state.addresses.filter((a) => a.id !== id)],
              }));
              toast.success("Address Updated", "Delivery address updated successfully.");
              return true;
            } else {
              console.error("Error updating address:", res.message);
              toast.error("Failed to Update Address", res.message || "Unable to update address.");
              return false;
            }
          } catch (err: any) {
            console.error("Error updating address:", err);
            toast.error("Network Error", err.message || "Failed to reach server. Please try again.");
            return false;
          }
        } else {
          set((state) => {
            const target = state.addresses.find((a) => a.id === id);
            const updated = target ? { ...target, ...updatedData } : null;
            if (!updated) return state;
            return {
              addresses: [updated, ...state.addresses.filter((a) => a.id !== id)],
            };
          });
          toast.success("Address Updated", "Delivery address updated.");
          return true;
        }
      },
      removeAddress: (id) => {
        const token = get().token;
        if (token) {
          get().removeAddressAsync(id).catch((err) => {
            console.error("Async remove address error:", err);
            toast.error("Failed to Delete Address", err?.message || "Unable to delete address.");
          });
        } else {
          set((state) => ({
            addresses: state.addresses.filter((addr) => addr.id !== id),
          }));
          toast.success("Address Removed", "Address removed.");
        }
      },
      removeAddressAsync: async (id) => {
        const token = get().token;
        if (token) {
          try {
            const res = await deleteCustomerAddressApi(token, id);
            if (res.success) {
              set((state) => ({
                addresses: state.addresses.filter((a) => a.id !== id),
              }));
              toast.success("Address Removed", "Address removed from your account.");
              return true;
            } else {
              console.error("Error deleting address:", res.message);
              toast.error("Failed to Delete Address", res.message || "Unable to delete address.");
              return false;
            }
          } catch (err: any) {
            console.error("Error deleting address:", err);
            toast.error("Network Error", err.message || "Failed to reach server.");
            return false;
          }
        } else {
          set((state) => ({
            addresses: state.addresses.filter((a) => a.id !== id),
          }));
          toast.success("Address Removed", "Address removed.");
          return true;
        }
      },
      // Bookmarks / Saved Packages
      bookmarkedPackageIds: [],
      bookmarkedPackages: [],

      fetchBookmarks: async () => {
        const token = get().token;
        if (!token) return;
        if (isTokenExpired(token)) {
          handleTokenExpiration("Your session has expired. Please sign in again.");
          return;
        }
        set({ isLoadingBookmarks: true });
        try {
          const res = await getBookmarksApi(token);
          if (res.success && res.data) {
            const ids = res.data.map((item) => item.package?._id).filter(Boolean);
            set({
              bookmarkedPackages: res.data,
              bookmarkedPackageIds: ids,
              isLoadingBookmarks: false,
            });
          } else {
            set({ isLoadingBookmarks: false });
            if (res && isAuthError(0, res.message)) {
              handleTokenExpiration(res.message);
            }
          }
        } catch (err: any) {
          console.error("Error fetching bookmarks:", err);
          set({ isLoadingBookmarks: false });
          if (err && isAuthError(0, err?.message)) {
            handleTokenExpiration(err.message);
          }
        }
      },

      toggleBookmark: async (packageId: string) => {
        const token = get().token;
        const currentIds = get().bookmarkedPackageIds;
        const currentlySaved = currentIds.includes(packageId);

        const nextIds = currentlySaved
          ? currentIds.filter((id) => id !== packageId)
          : [packageId, ...currentIds];
        set({ bookmarkedPackageIds: nextIds });

        if (token) {
          try {
            const res = await toggleBookmarkApi(token, packageId, currentlySaved);
            if (res.success) {
              get().fetchBookmarks();
              return !currentlySaved;
            } else {
              set({ bookmarkedPackageIds: currentIds });
              return currentlySaved;
            }
          } catch (err) {
            console.error("Error toggling bookmark:", err);
            set({ bookmarkedPackageIds: currentIds });
            return currentlySaved;
          }
        }
        return !currentlySaved;
      },

      isBookmarked: (packageId: string) => {
        return get().bookmarkedPackageIds.includes(packageId);
      },

      login: async (phone, token, customer) => {
        if (token && isTokenExpired(token)) {
          handleTokenExpiration("Your login session has expired. Please sign in again.");
          return;
        }
        const existingGuestCart = [...get().cart];
        set({
          isLoggedIn: true,
          guestMode: false,
          userPhone: phone,
          userName: customer?.fullName || ("User " + phone.slice(-4)),
          token: token || null,
          customerId: customer?.id || null,
          customerCode: customer?.customerCode || null,
        });
        if (token) {
          if (existingGuestCart.length > 0) {
            await syncGuestCartToServer(existingGuestCart, token);
          }
          await get().fetchServerCart();
          get().fetchAddresses();
          get().fetchBookmarks();
          get().fetchCustomerProfile();
        }
      },
      setAuth: async ({ token, customer }) => {
        if (token && isTokenExpired(token)) {
          handleTokenExpiration("Your login session has expired. Please sign in again.");
          return;
        }
        const existingGuestCart = [...get().cart];
        set({
          isLoggedIn: true,
          guestMode: false,
          userPhone: customer.mobile,
          userName: customer.fullName,
          token: token,
          customerId: customer.id,
          customerCode: customer.customerCode,
        });
        if (token && existingGuestCart.length > 0) {
          await syncGuestCartToServer(existingGuestCart, token);
        }
        await get().fetchServerCart();
        get().fetchAddresses();
        get().fetchBookmarks();
        get().fetchCustomerProfile();
      },
      fetchCustomerProfile: async () => {
        const token = get().token;
        if (!token) return;
        if (isTokenExpired(token)) {
          handleTokenExpiration("Your session has expired. Please sign in again.");
          return;
        }
        try {
          const res = await getCurrentCustomerApi(token);
          if (res.success && res.data) {
            set({
              isLoggedIn: true,
              guestMode: false,
              customerId: res.data.id,
              customerCode: res.data.customerCode,
              userName: res.data.fullName || get().userName,
              userPhone: res.data.mobile || get().userPhone,
            });
          } else if (res && isAuthError(0, res.message)) {
            handleTokenExpiration(res.message);
          }
        } catch (err: any) {
          console.error("Error fetching customer profile:", err);
          if (err && isAuthError(0, err?.message)) {
            handleTokenExpiration(err.message);
          }
        }
      },
      logout: () => set({ isLoggedIn: false, guestMode: true, token: null, customerId: null, customerCode: null, userPhone: "", userName: "", bookings: [], cart: [], cartId: null, cartPricing: null, bookmarkedPackageIds: [], bookmarkedPackages: [] }),
      updateProfile: (name, phone) => set({ userName: name, userPhone: phone }),
      addWalletFunds: (amount) => set((state) => ({ walletBalance: state.walletBalance + amount })),
      redeemLoyaltyPoints: (points) => set((state) => ({ loyaltyPoints: Math.max(0, state.loyaltyPoints - points) })),

      // Membership State & Actions
      isMember: false,
      membershipTier: null,
      membershipExpiry: null,
      freeServicesAvailable: 2,
      totalMembershipSavings: 1450,
      buyMembership: (tier = "VIP Pass") =>
        set({
          isMember: true,
          membershipTier: tier,
          membershipExpiry: "Aug 22, 2027",
          freeServicesAvailable: 2,
        }),
      toggleMembership: () =>
        set((state) => ({
          isMember: !state.isMember,
          membershipTier: !state.isMember ? "VIP Pass" : null,
          membershipExpiry: !state.isMember ? "Aug 22, 2027" : null,
          freeServicesAvailable: !state.isMember ? 2 : 0,
        })),
      claimFreeService: () =>
        set((state) => ({
          freeServicesAvailable: Math.max(0, state.freeServicesAvailable - 1),
        })),

      // Cart
      cart: [],
      cartId: null,
      cartPricing: null,

      fetchServerCart: async () => {
        const token = get().token;
        if (!token) return;
        if (isTokenExpired(token)) {
          handleTokenExpiration("Your session has expired. Please sign in again.");
          return;
        }
        try {
          const res = await getCartApi(token);
          if (res.success && res.data) {
            const rawItems = res.data.items || res.data.cart?.items || (res.data as any).data?.items || [];
            let mappedItems: CartItem[] = rawItems.map((item: any) => {
              const pkgObj = typeof item.package === "object" && item.package ? item.package : (typeof item.packageId === "object" && item.packageId ? item.packageId : {});
              const pkgId = typeof item.package === "string"
                ? item.package
                : typeof item.packageId === "string"
                  ? item.packageId
                  : (pkgObj._id || pkgObj.id || item.itemId || item._id);

              const pkgName = pkgObj.packageName || pkgObj.name || pkgObj.title || item.name || null;
              const pkgPrice = typeof pkgObj.price === "number" ? pkgObj.price : (typeof item.price === "number" ? item.price : item.packageTotal || 0);
              const pkgDuration = pkgObj.duration || item.duration || 30;
              const rawImg = pkgObj.imageUrl || pkgObj.thumbnailUrl || (pkgObj as any).image || item.imageUrl || item.image;
              const formattedImg = rawImg ? formatImageUrl(rawImg) : (pkgId && String(pkgId).match(/[0-9a-fA-F]{24}/) ? `/api/media/package/${pkgId}/image` : undefined);

              return {
                id: pkgId || item.itemId || item._id,
                itemId: item.itemId || item._id || pkgId,
                packageId: pkgId,
                name: pkgName || "Service Package",
                price: pkgPrice,
                quantity: item.quantity || 1,
                duration: pkgDuration,
                category: item.category || pkgObj.category || "Service",
                imageUrl: formattedImg,
                image: formattedImg,
                selectedAddons: (item.selectedAddons || []).map((addon: any) => {
                  const aId = String(addon.addonId?._id || addon.addonId || addon.id || "");
                  const rawAddonImg = addon.imageUrl || addon.image || (addon.addonId && addon.addonId.imageUrl);
                  const formattedAddonImg = rawAddonImg ? formatImageUrl(rawAddonImg) : (aId ? `/api/media/addon/${aId}/image` : undefined);
                  return {
                    addonId: aId,
                    addonName: addon.addonName || (addon.addonId && addon.addonId.addonName) || "Add-on",
                    price: typeof addon.price === "number" ? addon.price : 0,
                    quantity: addon.quantity || 1,
                    totalPrice: addon.totalPrice || ((addon.price || 0) * (addon.quantity || 1)),
                    imageUrl: formattedAddonImg,
                    image: formattedAddonImg,
                  };
                }),
              };
            });

            const currentCart = get().cart;

            if (mappedItems.length === 0) {
              set({
                cart: [],
                cartId: res.data.cartId || res.data.cart?._id || null,
                cartPricing: res.data.pricing || null,
              });
              return;
            }

            const findLocalMatch = (m: CartItem) => {
              return currentCart.find((c) => {
                if (c.id && m.id && String(c.id) === String(m.id)) return true;
                if (c.itemId && m.itemId && String(c.itemId) === String(m.itemId)) return true;
                if (c.id && m.itemId && String(c.id) === String(m.itemId)) return true;
                if (c.itemId && m.id && String(c.itemId) === String(m.id)) return true;
                return false;
              });
            };

            const finalCart: CartItem[] = mappedItems.map((m) => {
              const localMatch = findLocalMatch(m);
              const pkgHex = (String(m.packageId || m.itemId || m.id).match(/[0-9a-fA-F]{24}/) || [])[0];
              const mapAddons = (pkgHex && get().packageAddonsMap?.[pkgHex]) || get().packageAddonsMap?.[m.id] || [];
              const storedAddons = (localMatch && localMatch.availableAddons && localMatch.availableAddons.length > 0)
                ? localMatch.availableAddons
                : mapAddons;

              if (localMatch) {
                return {
                  ...localMatch,
                  ...m,
                  name: (m.name && m.name !== "Service Package") ? m.name : localMatch.name,
                  price: m.price > 0 ? m.price : localMatch.price,
                  duration: m.duration || localMatch.duration,
                  category: localMatch.category || m.category,
                  imageUrl: m.imageUrl || localMatch.imageUrl || localMatch.image,
                  image: m.image || localMatch.image || localMatch.imageUrl,
                  availableAddons: storedAddons,
                };
              }
              return {
                ...m,
                availableAddons: storedAddons,
              };
            });

            set({
              cart: finalCart,
              cartId: res.data.cartId || res.data.cart?._id || null,
              cartPricing: res.data.pricing || null,
            });
          } else if (res && !res.success && isAuthError(0, res.message)) {
            handleTokenExpiration(res.message);
          }
        } catch (err: any) {
          console.error("Error fetching cart from server:", err);
          if (err && isAuthError(0, err?.message)) {
            handleTokenExpiration(err.message);
          }
        }
      },

      packageAddonsMap: {},
      setPackageAddons: (packageId: string, addons: any[], packageName?: string) => {
        if (!packageId || !Array.isArray(addons)) return;
        const normalized: CartAddon[] = addons.map((a: any) => {
          const aId = String(a.id || a._id || a.addonId || "");
          const aName = a.name || a.addonName || a.title || "Service Add-on";
          const aPrice = typeof a.price === "number" ? a.price : Number(a.price) || 0;
          const aDesc = a.description || "";
          const aImg = a.imageUrl || a.image ? formatImageUrl(a.imageUrl || a.image) : (aId ? `/api/media/addon/${aId}/image` : "");
          return {
            id: aId,
            _id: aId,
            name: aName,
            addonName: aName,
            price: aPrice,
            description: aDesc,
            imageUrl: aImg,
            image: aImg,
            unit: a.unit || "",
            packageId,
            packageName,
          };
        });

        set((state) => {
          const updatedMap = { ...state.packageAddonsMap, [packageId]: normalized };
          const hexMatch = String(packageId).match(/[0-9a-fA-F]{24}/);
          if (hexMatch) {
            updatedMap[hexMatch[0]] = normalized;
          }
          return { packageAddonsMap: updatedMap };
        });
      },

      addToCart: async (item: (Omit<CartItem, "quantity"> | CartItem) & { addons?: any[]; availableAddons?: any[] }, quantityOverride?: number) => {
        const targetId = item.id || item.itemId || `pkg-${Date.now()}`;
        const itemQuantity = quantityOverride || (item as any).quantity || 1;
        const rawItemImg = (item as any).imageUrl || (item as any).image;
        const cleanItemImg = rawItemImg ? formatImageUrl(rawItemImg) : undefined;

        // Extract and normalize available addons passed with package
        const rawAddons = item.availableAddons || (item as any).addons || [];
        const normalizedAddons: CartAddon[] = Array.isArray(rawAddons)
          ? rawAddons.map((a: any) => {
              const aId = String(a.id || a._id || a.addonId || "");
              const aName = a.name || a.addonName || a.title || "Service Add-on";
              const aPrice = typeof a.price === "number" ? a.price : Number(a.price) || 0;
              const aDesc = a.description || "";
              const aImg = a.imageUrl || a.image ? formatImageUrl(a.imageUrl || a.image) : (aId ? `/api/media/addon/${aId}/image` : "");
              return {
                id: aId,
                _id: aId,
                name: aName,
                addonName: aName,
                price: aPrice,
                description: aDesc,
                imageUrl: aImg,
                image: aImg,
                unit: a.unit || "",
                packageId: targetId,
                packageName: item.name,
              };
            })
          : [];

        set((state) => {
          let updated: CartItem[];
          const existingIndex = state.cart.findIndex((i) =>
            (i.id && String(i.id) === String(targetId)) ||
            (i.itemId && String(i.itemId) === String(targetId))
          );

          // Update packageAddonsMap if addons provided
          const newAddonsMap = { ...state.packageAddonsMap };
          if (normalizedAddons.length > 0) {
            newAddonsMap[targetId] = normalizedAddons;
            const hexMatch = String(targetId).match(/[0-9a-fA-F]{24}/);
            if (hexMatch) {
              newAddonsMap[hexMatch[0]] = normalizedAddons;
            }
          }

          if (existingIndex >= 0) {
            updated = [...state.cart];
            const prevItem = updated[existingIndex];
            const mergedAddons = normalizedAddons.length > 0
              ? normalizedAddons
              : (prevItem.availableAddons && prevItem.availableAddons.length > 0)
              ? prevItem.availableAddons
              : newAddonsMap[targetId] || [];

            updated[existingIndex] = {
              ...prevItem,
              quantity: (prevItem.quantity || 1) + itemQuantity,
              image: prevItem.image || cleanItemImg,
              imageUrl: prevItem.imageUrl || cleanItemImg,
              availableAddons: mergedAddons,
              selectedAddons: (item.selectedAddons && item.selectedAddons.length > 0) ? item.selectedAddons : prevItem.selectedAddons,
            };
          } else {
            const hexMatch = typeof targetId === "string" ? targetId.match(/[0-9a-fA-F]{24}/) : null;
            const cleanPkgId = hexMatch ? hexMatch[0] : undefined;
            const finalAddons = normalizedAddons.length > 0
              ? normalizedAddons
              : (cleanPkgId && newAddonsMap[cleanPkgId]) || newAddonsMap[targetId] || [];

            const newItem: CartItem = {
              id: targetId,
              itemId: item.itemId || targetId,
              packageId: (item as any).packageId || cleanPkgId,
              name: item.name || "Service Package",
              price: item.price || 0,
              category: item.category || "Service",
              duration: item.duration || 30,
              quantity: itemQuantity,
              image: cleanItemImg,
              imageUrl: cleanItemImg,
              availableAddons: finalAddons,
              selectedAddons: item.selectedAddons || [],
            };
            updated = [...state.cart, newItem];
          }
          return {
            cart: updated,
            packageAddonsMap: newAddonsMap,
            ...(!state.token ? { cartPricing: calculateGuestPricing(updated) } : {}),
          };
        });

        const token = get().token;
        if (token && targetId) {
          try {
            const addRes = await addToCartApi(token, targetId, itemQuantity);
            if (item.selectedAddons && Array.isArray(item.selectedAddons) && item.selectedAddons.length > 0) {
              let serverItemId: string | undefined;
              if (addRes?.success && addRes.data?.cart?.items) {
                const serverItem = addRes.data.cart.items.find((si: any) =>
                  String(si.packageId?._id || si.packageId) === String(targetId)
                );
                serverItemId = serverItem?._id || serverItem?.itemId;
              }
              if (serverItemId) {
                for (const addon of item.selectedAddons) {
                  const aId = addon.addonId || (addon as any).id || (addon as any)._id;
                  if (aId) {
                    try {
                      await updateCartAddonApi(token, serverItemId, aId, "add");
                    } catch (aErr) {
                      console.error("Error adding initial addon to server cart:", aErr);
                    }
                  }
                }
              }
            }
            await get().fetchServerCart();
          } catch (err) {
            console.error("Error adding to server cart:", err);
          }
        }
      },

      removeFromCart: async (id) => {
        const token = get().token;
        const targetItem = get().cart.find((i) => i.id === id || i.itemId === id);
        const itemId = targetItem?.itemId || targetItem?.id || id;

        // Optimistically remove from local state immediately
        set((state) => {
          const updated = state.cart.filter((item) => item.id !== id && item.itemId !== id);
          return {
            cart: updated,
            ...(!state.token ? { cartPricing: calculateGuestPricing(updated) } : {}),
          };
        });

        if (token && itemId) {
          try {
            await removeCartItemApi(token, itemId);
            await get().fetchServerCart();
          } catch (err) {
            console.error("Error removing from server cart:", err);
          }
        }
      },

      updateCartQuantity: async (id, quantity) => {
        const token = get().token;
        const targetItem = get().cart.find((i) => i.id === id || i.itemId === id);
        const itemId = targetItem?.itemId || targetItem?.id || id;

        // Optimistically update local state immediately
        set((state) => {
          const updated = quantity <= 0
            ? state.cart.filter((item) => item.id !== id && item.itemId !== id)
            : state.cart.map((item) => ((item.id === id || item.itemId === id) ? { ...item, quantity } : item));
          return {
            cart: updated,
            ...(!state.token ? { cartPricing: calculateGuestPricing(updated) } : {}),
          };
        });

        if (token && itemId) {
          try {
            if (quantity <= 0) {
              await removeCartItemApi(token, itemId);
            } else {
              await updateCartItemApi(token, itemId, quantity);
            }
            await get().fetchServerCart();
          } catch (err) {
            console.error("Error updating server cart quantity:", err);
          }
        }
      },

      clearCart: async () => {
        const token = get().token;
        if (token) {
          try {
            await clearCartApi(token);
          } catch (err) {
            console.error("Error clearing server cart:", err);
          }
        }
        set({
          cart: [],
          cartId: null,
          cartPricing: null,
          selectedAddressId: null,
          selectedDate: null,
          selectedTimeSlot: null,
          appliedCoupon: null,
        });
      },

      toggleAddonInCart: async (itemId, addonId, action, addonDetails) => {
        const token = get().token;
        const currentCart = get().cart;
        const targetItem = currentCart.find(
          (i) => i.id === itemId || i.itemId === itemId || i.packageId === itemId ||
            (itemId && (String(i.id).includes(String(itemId)) || String(itemId).includes(String(i.id))))
        ) || (currentCart.length === 1 ? currentCart[0] : undefined);
        const serverItemId = targetItem?.itemId || targetItem?.id || itemId;

        if (token && serverItemId) {
          try {
            await updateCartAddonApi(token, serverItemId, addonId, action);
            await get().fetchServerCart();
            return;
          } catch (err) {
            console.error("Error updating cart addon on server:", err);
          }
        }

        set((state) => {
          const updatedCart = state.cart.map((item) => {
            const isTarget =
              item.id === itemId ||
              item.itemId === itemId ||
              item.packageId === itemId ||
              (itemId && (String(item.id).includes(String(itemId)) || String(itemId).includes(String(item.id)))) ||
              (targetItem && (item.id === targetItem.id || item.itemId === targetItem.itemId));
            if (isTarget) {
              const currentAddons = item.selectedAddons || [];
              let newAddons = [...currentAddons];
              if (action === "add") {
                const existingIdx = newAddons.findIndex((a) => String(a.addonId) === String(addonId));
                const availAddon = (item.availableAddons || []).find((a: any) => String(a.id || a._id) === String(addonId));
                const name = addonDetails?.addonName || availAddon?.name || availAddon?.addonName || "Addon";
                const priceVal = typeof addonDetails?.price === "number" ? addonDetails.price : (availAddon?.price || 0);
                const rawAddonImg = addonDetails?.imageUrl || (addonDetails as any)?.image || availAddon?.imageUrl || availAddon?.image;
                const formattedAddonImg = rawAddonImg ? formatImageUrl(rawAddonImg) : (addonId ? `/api/media/addon/${addonId}/image` : undefined);
                if (existingIdx >= 0) {
                  const existing = newAddons[existingIdx];
                  newAddons[existingIdx] = {
                    ...existing,
                    addonName: (name && name !== "Addon") ? name : existing.addonName,
                    price: priceVal > 0 ? priceVal : existing.price,
                    totalPrice: (priceVal > 0 ? priceVal : existing.price) * (existing.quantity || 1),
                    imageUrl: existing.imageUrl || formattedAddonImg,
                    image: existing.image || formattedAddonImg,
                  };
                } else {
                  newAddons.push({
                    addonId,
                    addonName: name,
                    price: priceVal,
                    quantity: 1,
                    totalPrice: priceVal,
                    imageUrl: formattedAddonImg,
                    image: formattedAddonImg,
                  });
                }
              } else {
                newAddons = newAddons.filter((a) => String(a.addonId) !== String(addonId));
              }
              return { ...item, selectedAddons: newAddons };
            }
            return item;
          });

          return {
            cart: updatedCart,
            ...(!state.token ? { cartPricing: calculateGuestPricing(updatedCart) } : {}),
          };
        });
      },

      // Location & Checkout Details
      selectedLocation: "Varanasi",
      setSelectedLocation: (loc) => set({ selectedLocation: loc }),
      locationPermissionDenied: false,
      setLocationPermissionDenied: (denied) => set({ locationPermissionDenied: denied }),
      hasPromptedLocation: false,
      setHasPromptedLocation: (prompted) => set({ hasPromptedLocation: prompted }),
      isLocationSet: false,
      setIsLocationSet: (val) => set({ isLocationSet: val }),
      isOutOfServiceZone: false,
      setIsOutOfServiceZone: (val) => set({ isOutOfServiceZone: val }),
      selectedAddressId: null,
      setSelectedAddressId: (id) => set({ selectedAddressId: id }),
      selectedDate: null,
      setSelectedDate: (date) => set({ selectedDate: date }),
      selectedTimeSlot: null,
      setSelectedTimeSlot: (slot) => set({ selectedTimeSlot: slot }),
      appliedCoupon: null,
      applyCoupon: (code) => {
        const cleaned = code.trim().toUpperCase();
        const validCodes = ["HELPMATE20", "LUXURY50", "COOLING100", "SUPERFEST", "WELCOME100", "SUPERDEAL"];
        if (validCodes.includes(cleaned)) {
          set({ appliedCoupon: cleaned });
          return true;
        }
        return false;
      },
      removeCoupon: () => set({ appliedCoupon: null }),

      // Bookings
      bookings: [],
      seedMockBookings: () => {
        const mockBookings: Booking[] = [
          {
            id: "BK-890213",
            items: [
              { id: "foam-jet", name: "Foam & Power Jet Service", price: 599, quantity: 1, category: "ac", duration: 60 }
            ],
            address: { id: "1", tag: "Home", addressLine: "B-2/30, Assi Ghat Road, Near Assi Ghat", city: "Varanasi" },
            date: "Jul 15, 2026",
            timeSlot: "10:00 AM",
            totalAmount: 599,
            discount: 100,
            finalAmount: 499,
            status: "Completed",
            professional: {
              name: "Arjun Mehta",
              rating: 4.9,
              completedJobs: 1240,
              avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&h=150&q=80",
              phone: "+91 98765 43210"
            },
            otp: "4829",
            timeline: [
              { status: "Booking Confirmed", time: "09:30 AM", done: true },
              { status: "Professional Assigned", time: "09:35 AM", done: true },
              { status: "In-Transit to Location", time: "09:50 AM", done: true },
              { status: "Arrived at Address", time: "09:58 AM", done: true },
              { status: "Service Completed", time: "11:00 AM", done: true },
            ],
            invoiceId: "INV-78329401",
            dateCreated: "Jul 15, 2026"
          },
          {
            id: "BK-432109",
            items: [
              { id: "full-home", name: "Full Home Intense Deep Clean", price: 2999, quantity: 1, category: "cleaning", duration: 240 }
            ],
            address: { id: "2", tag: "Work", addressLine: "S-20/54, Nadesar, Cantonment", city: "Varanasi" },
            date: "Jul 12, 2026",
            timeSlot: "08:00 AM",
            totalAmount: 2999,
            discount: 500,
            finalAmount: 2499,
            status: "Completed",
            professional: {
              name: "Neha Patil",
              rating: 4.95,
              completedJobs: 1530,
              avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=150&h=150&q=80",
              phone: "+91 95432 10987"
            },
            otp: "1098",
            timeline: [
              { status: "Booking Confirmed", time: "07:30 AM", done: true },
              { status: "Professional Assigned", time: "07:35 AM", done: true },
              { status: "In-Transit to Location", time: "07:50 AM", done: true },
              { status: "Arrived at Address", time: "07:58 AM", done: true },
              { status: "Service Completed", time: "12:15 PM", done: true },
            ],
            invoiceId: "INV-89041235",
            dateCreated: "Jul 12, 2026"
          },
          {
            id: "BK-109283",
            items: [
              { id: "gas-refill", name: "Gas Leakage Fix & Refill", price: 1599, quantity: 1, category: "ac", duration: 90 }
            ],
            address: { id: "1", tag: "Home", addressLine: "B-2/30, Assi Ghat Road, Near Assi Ghat", city: "Varanasi" },
            date: "Jul 17, 2026",
            timeSlot: "02:00 PM",
            totalAmount: 1599,
            discount: 0,
            finalAmount: 1599,
            status: "Assigned",
            professional: {
              name: "Rahul Ranade",
              rating: 4.88,
              completedJobs: 980,
              avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=150&h=150&q=80",
              phone: "+91 91234 56789"
            },
            otp: "9048",
            timeline: [
              { status: "Booking Confirmed", time: "01:30 PM", done: true },
              { status: "Professional Assigned", time: "01:35 PM", done: true },
              { status: "In-Transit to Location", time: "Pending", done: false },
              { status: "Arrived at Address", time: "Pending", done: false },
              { status: "Service Completed", time: "Pending", done: false },
            ],
            invoiceId: "INV-90483719",
            dateCreated: "Jul 17, 2026"
          }
        ];
        set({ bookings: mockBookings });
      },
      createBooking: () => {
        const state = get();
        if (state.cart.length === 0 || !state.selectedAddressId || !state.selectedDate || !state.selectedTimeSlot) {
          return null;
        }

        const address = state.addresses.find((a) => a.id === state.selectedAddressId) || state.addresses[0];
        const itemsSubtotal = state.cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
        const addonSubtotal = state.cartPricing?.addonSubtotal ?? state.cart.reduce((sum, item) => sum + getItemAddonTotal(item), 0);
        const subtotal = itemsSubtotal + addonSubtotal;
        let discount = 0;
        if (state.appliedCoupon === "LUXURY50") discount = Math.min(500, subtotal * 0.15); // 15% off up to 500
        if (state.appliedCoupon === "WELCOME100") discount = 100;
        if (state.appliedCoupon === "SUPERDEAL") discount = Math.min(1000, subtotal * 0.25); // 25% off up to 1000

        const finalAmount = Math.max(0, subtotal - discount);

        const professionals = [
          { name: "Arjun Mehta", rating: 4.9, completedJobs: 1240, avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&h=150&q=80", phone: "+91 98765 43210", eta: "15 mins" },
          { name: "Rahul Ranade", rating: 4.85, completedJobs: 980, avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=150&h=150&q=80", phone: "+91 91234 56789", eta: "25 mins" },
          { name: "Neha Patil", rating: 4.95, completedJobs: 1530, avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=150&h=150&q=80", phone: "+91 95432 10987", eta: "8 mins" }
        ];
        const chosenProf = professionals[Math.floor(Math.random() * professionals.length)];

        const newBooking: Booking = {
          id: "BK-" + Math.floor(100000 + Math.random() * 900000).toString(),
          items: state.cart,
          address,
          date: state.selectedDate,
          timeSlot: state.selectedTimeSlot,
          totalAmount: subtotal,
          discount,
          finalAmount,
          status: "Assigned",
          professional: chosenProf,
          otp: Math.floor(1000 + Math.random() * 9000).toString(),
          dateCreated: new Date().toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }),
          invoiceId: "INV-" + Math.floor(10000000 + Math.random() * 90000000).toString(),
          timeline: [
            { status: "Booking Confirmed", time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }), done: true },
            { status: "Professional Assigned", time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }), done: true },
            { status: "In-Transit to Location", time: "Pending", done: false },
            { status: "Arrived at Address", time: "Pending", done: false },
            { status: "Service Completed", time: "Pending", done: false },
          ],
        };

        set((state) => ({
          bookings: [newBooking, ...state.bookings],
        }));

        // Send a notification
        get().addNotification(
          "Booking Confirmed!",
          `Your service booking ${newBooking.id} is confirmed. ${chosenProf.name} will arrive on ${newBooking.date} at ${newBooking.timeSlot}.`,
          "success"
        );

        // Clear cart
        get().clearCart();
        return newBooking;
      },
      fetchBookings: async () => {
        const state = get();
        if (!state.token) return;
        if (isTokenExpired(state.token)) {
          handleTokenExpiration("Your session has expired. Please sign in again.");
          return;
        }
        set({ isLoadingBookings: true });

        try {
          const res = await fetchCustomerBookingsApi(state.token);
          if (res.success && res.data) {
            let mappedBookings: Booking[] = res.data.map((item) => {
              const defaultAddress: Address = state.addresses[0] || {
                id: "1",
                tag: "Home",
                addressLine: "Registered Customer Location",
                city: "Varanasi"
              };

              let mappedStatus: Booking["status"] = "Pending";
              if (item.status === "completed") mappedStatus = "Completed";
              else if (item.status === "cancelled") mappedStatus = "Cancelled";
              else if (item.status === "in_progress") mappedStatus = "In-Progress";
              else if (item.status === "on_the_way" || item.status === "accepted") mappedStatus = "In-Transit";
              else if (item.status === "partner_assigned") mappedStatus = "Assigned";
              else if (item.status === "pending") mappedStatus = "Pending";

              const firstService = item.services?.[0];
              const pkgName = item.serviceVariant || (firstService?.package as any)?.name || "Service Package";
              const catSlug = (firstService?.category as any)?.name
                ? (firstService.category as any).name.toLowerCase().replace(/[^a-z0-9]+/g, "-")
                : "general";

              const items = item.services && item.services.length > 0
                ? item.services.map((srv, idx) => {
                  const pkgObj = (srv.package as any) || {};
                  const pkgId = pkgObj._id || pkgObj.id || (srv as any).packageId || `pkg-${idx}`;
                  const pkgRev = pkgObj.review || (srv as any).review;
                  let mappedPkgRev: CartItem["review"] = undefined;
                  if (pkgRev && typeof pkgRev === "object" && (pkgRev._id || pkgRev.id || pkgRev.rating)) {
                    mappedPkgRev = {
                      reviewId: pkgRev._id || pkgRev.id,
                      rating: Number(pkgRev.rating) || 5,
                      comment: pkgRev.review || pkgRev.comment || "",
                      dateCreated: pkgRev.createdAt ? new Date(pkgRev.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric" }) : "Just now"
                    };
                  }

                  return {
                    id: pkgId,
                    packageId: pkgId,
                    name: pkgObj.name || pkgObj.packageName || pkgName,
                    price: pkgObj.price || srv.totalPrice || item.amount,
                    quantity: srv.quantity || 1,
                    category: catSlug,
                    duration: pkgObj.duration || 60,
                    review: mappedPkgRev
                  };
                })
                : [
                  {
                    id: (item as any)?.packageId || (item as any)?.package?._id || (item as any)?.package?.id || item.bookingId,
                    packageId: (item as any)?.packageId || (item as any)?.package?._id || (item as any)?.package?.id || item.bookingId,
                    name: pkgName,
                    price: item.amount,
                    quantity: 1,
                    category: catSlug,
                    duration: 60,
                    review: undefined
                  }
                ];

              let formattedDate = item.bookingDate;
              if (item.bookingDate) {
                try {
                  const d = new Date(item.bookingDate);
                  if (!isNaN(d.getTime())) {
                    formattedDate = d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
                  }
                } catch (e) { }
              }
              if (!formattedDate) {
                formattedDate = new Date(item.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
              }

              const st = mappedStatus as string;
              const isAssigned = st === "Assigned" || st === "In-Transit" || st === "Arrived" || st === "In-Progress" || st === "Completed";
              const isTransit = st === "In-Transit" || st === "Arrived" || st === "In-Progress" || st === "Completed";
              const isArrived = st === "Arrived" || st === "In-Progress" || st === "Completed";
              const isCompleted = st === "Completed";

              // Directly extract review object from GET /api/customer/bookings response
              let mappedReview: Booking["review"] = undefined;
              const itemRev = (item as any).review;
              if (itemRev && typeof itemRev === "object" && (itemRev._id || itemRev.id || itemRev.rating)) {
                mappedReview = {
                  reviewId: itemRev._id || itemRev.id,
                  rating: Number(itemRev.rating) || 5,
                  comment: itemRev.review || itemRev.comment || "",
                  dateCreated: itemRev.createdAt ? new Date(itemRev.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric" }) : "Just now"
                };
              }

              if (!mappedReview && item.services && Array.isArray(item.services)) {
                for (const srv of item.services) {
                  const pkgRev = (srv.package as any)?.review || (srv as any)?.review;
                  if (pkgRev && typeof pkgRev === "object" && (pkgRev._id || pkgRev.id || pkgRev.rating)) {
                    mappedReview = {
                      reviewId: pkgRev._id || pkgRev.id,
                      rating: Number(pkgRev.rating) || 5,
                      comment: pkgRev.review || pkgRev.comment || "",
                      dateCreated: pkgRev.createdAt ? new Date(pkgRev.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric" }) : "Just now"
                    };
                    break;
                  }
                }
              }

              return {
                id: item.bookingId || (item as any)._id || item.bookingNumber,
                bookingNumber: item.bookingNumber || item.bookingId,
                items,
                address: defaultAddress,
                date: formattedDate,
                timeSlot: item.timeSlot || "10:00 AM",
                totalAmount: item.amount,
                discount: 0,
                finalAmount: item.amount,
                status: mappedStatus,
                review: mappedReview,
                professional: {
                  name: "Vetted Helpmate Pro",
                  rating: 4.9,
                  completedJobs: 1240,
                  avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&h=150&q=80",
                  phone: "+91 98765 43210"
                },
                otp: "4829",
                dateCreated: new Date(item.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }),
                invoiceId: "INV-" + (item.bookingNumber || item.bookingId).replace(/[^0-9]/g, ""),
                timeline: [
                  { status: "Booking Confirmed", time: "Completed", done: true },
                  { status: "Professional Assigned", time: isAssigned ? "Completed" : "Pending", done: isAssigned },
                  { status: "In-Transit to Location", time: isTransit ? "Completed" : "Pending", done: isTransit },
                  { status: "Arrived at Address", time: isArrived ? "Completed" : "Pending", done: isArrived },
                  { status: "Service Completed", time: isCompleted ? "Completed" : "Pending", done: isCompleted },
                ],
              };
            });

            set({ bookings: mappedBookings, isLoadingBookings: false });
          } else {
            set({ isLoadingBookings: false });
            if (res && isAuthError(0, res.message)) {
              handleTokenExpiration(res.message);
            }
          }
        } catch (err: any) {
          console.error("Error in fetchBookings:", err);
          set({ isLoadingBookings: false });
          if (err && isAuthError(0, err?.message)) {
            handleTokenExpiration(err.message);
          }
        }
      },
      createBookingAsync: async (paymentMethod = "pay_after_service") => {
        const state = get();
        if (state.cart.length === 0 || !state.selectedAddressId || !state.selectedDate || !state.selectedTimeSlot) {
          return { success: false, message: "Please select a valid address, date, and time slot." };
        }

        if (!state.token) {
          return { success: false, message: "Authentication required. Please Sign In or Sign Up to book a service." };
        }

        const address = state.addresses.find((a) => a.id === state.selectedAddressId) || state.addresses[0];

        try {
          const res = await createBookingApi({
            addressId: state.selectedAddressId,
            bookingDate: state.selectedDate,
            timeSlot: state.selectedTimeSlot,
            paymentMethod: paymentMethod || "pay_after_service"
          }, state.token);

          if (res.success && res.data) {
            const bData = res.data;
            const itemsSubtotal = state.cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
            const addonSubtotal = state.cartPricing?.addonSubtotal ?? state.cart.reduce((sum, item) => sum + getItemAddonTotal(item), 0);
            const subtotal = itemsSubtotal + addonSubtotal;

            const professionals = [
              { name: "Arjun Mehta", rating: 4.9, completedJobs: 1240, avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&h=150&q=80", phone: "+91 98765 43210", eta: "15 mins" },
              { name: "Rahul Ranade", rating: 4.85, completedJobs: 980, avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=150&h=150&q=80", phone: "+91 91234 56789", eta: "25 mins" },
              { name: "Neha Patil", rating: 4.95, completedJobs: 1530, avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=150&h=150&q=80", phone: "+91 95432 10987", eta: "8 mins" }
            ];
            const chosenProf = professionals[Math.floor(Math.random() * professionals.length)];

            const newBooking: Booking = {
              id: bData.bookingId || (bData as any)._id || bData.bookingNumber,
              bookingNumber: bData.bookingNumber || bData.bookingId,
              items: state.cart,
              address,
              date: state.selectedDate,
              timeSlot: state.selectedTimeSlot,
              totalAmount: subtotal,
              discount: 0,
              finalAmount: bData.totalAmount || subtotal,
              status: "Assigned",
              professional: chosenProf,
              otp: Math.floor(1000 + Math.random() * 9000).toString(),
              dateCreated: new Date().toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }),
              invoiceId: "INV-" + Math.floor(10000000 + Math.random() * 90000000).toString(),
              timeline: [
                { status: "Booking Confirmed", time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }), done: true },
                { status: "Professional Assigned", time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }), done: true },
                { status: "In-Transit to Location", time: "Pending", done: false },
                { status: "Arrived at Address", time: "Pending", done: false },
                { status: "Service Completed", time: "Pending", done: false },
              ],
            };

            set((s) => ({
              bookings: [newBooking, ...s.bookings],
              cart: []
            }));

            get().addNotification(
              "Booking Confirmed!",
              `Your service booking ${newBooking.id} is confirmed. ${chosenProf.name} will arrive on ${newBooking.date} at ${newBooking.timeSlot}.`,
              "success"
            );

            return { success: true, message: res.message, booking: newBooking };
          } else {
            return { success: false, message: res.message || "Failed to create booking." };
          }
        } catch (err: any) {
          console.error("Error creating booking via API:", err);
          return { success: false, message: err.message || "Failed to create booking." };
        }
      },
      cancelBooking: (id) =>
        set((state) => {
          const updated = state.bookings.map((booking) => {
            if (booking.id === id) {
              return {
                ...booking,
                status: "Cancelled" as const,
                timeline: booking.timeline.map((step) =>
                  step.status === "Service Completed" ? { ...step, status: "Cancelled", done: true } : step
                ),
              };
            }
            return booking;
          });

          get().addNotification(
            "Booking Cancelled",
            `Your booking ${id} has been cancelled successfully. Refund has been initiated.`,
            "warning"
          );

          return { bookings: updated };
        }),
      rescheduleBooking: (id, date, slot) =>
        set((state) => {
          const updated = state.bookings.map((booking) => {
            if (booking.id === id) {
              return { ...booking, date, timeSlot: slot };
            }
            return booking;
          });

          get().addNotification(
            "Booking Rescheduled",
            `Your booking ${id} has been rescheduled to ${date} at ${slot}.`,
            "info"
          );

          return { bookings: updated };
        }),
      updateBookingStatus: (id, status) =>
        set((state) => {
          const updated = state.bookings.map((booking) => {
            if (booking.id === id) {
              const nowTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
              const timeline = booking.timeline.map((step) => {
                if (step.status === "In-Transit to Location" && status === "In-Transit") return { ...step, time: nowTime, done: true };
                if (step.status === "Arrived at Address" && status === "Arrived") return { ...step, time: nowTime, done: true };
                if (step.status === "Service Completed" && status === "Completed") return { ...step, time: nowTime, done: true };
                return step;
              });

              // Adjust main status
              return { ...booking, status, timeline };
            }
            return booking;
          });

          return { bookings: updated };
        }),

      // Reviews
      createReviewAsync: async (payload) => {
        const token = get().token;
        if (!token) {
          return { success: false, message: "Authentication required to submit review." };
        }
        return await createReviewApi(token, payload);
      },
      updateReviewAsync: async (reviewId, payload) => {
        const token = get().token;
        if (!token) {
          return { success: false, message: "Authentication required to update review." };
        }
        return await updateReviewApi(token, reviewId, payload);
      },
      deleteReviewAsync: async (reviewId) => {
        const token = get().token;
        if (!token) {
          return { success: false, message: "Authentication required to delete review." };
        }
        return await deleteReviewApi(token, reviewId);
      },
      fetchPackageReviewsAsync: async (packageId) => {
        const token = get().token || undefined;
        return await fetchCustomerReviewsApi(packageId, token);
      },
      attachReviewToBooking: (bookingId, review, packageId) =>
        set((state) => ({
          bookings: state.bookings.map((b) => {
            if (b.id === bookingId || b.bookingNumber === bookingId) {
              const updatedItems = b.items.map((item) => {
                if (!packageId || item.id === packageId || item.itemId === packageId || item.packageId === packageId) {
                  return { ...item, review: review || null };
                }
                return item;
              });
              return {
                ...b,
                review: review || b.review,
                items: updatedItems,
              };
            }
            return b;
          }),
        })),



      // Wishlist & History
      wishlist: [],
      toggleWishlist: (id) =>
        set((state) => {
          const exists = state.wishlist.includes(id);
          const updated = exists ? state.wishlist.filter((w) => w !== id) : [...state.wishlist, id];
          return { wishlist: updated };
        }),
      recentlyViewed: [],
      addToRecentlyViewed: (id) =>
        set((state) => {
          const filtered = state.recentlyViewed.filter((item) => item !== id);
          return { recentlyViewed: [id, ...filtered].slice(0, 5) }; // Limit to 5
        }),

      // Notifications
      notifications: [
        { id: "1", title: "Welcome to HelpMate", message: "Enjoy 15% off on your first order using code LUXURY50.", type: "info", date: "Just now" },
      ],
      addNotification: (title, message, type = "info") => {
        if (type === "error") {
          toast.error(title, message);
        } else if (type === "warning") {
          toast.warning(title, message);
        } else if (type === "success") {
          toast.success(title, message);
        } else {
          toast.info(title, message);
        }

        set((state) => ({
          notifications: [
            {
              id: Math.random().toString(),
              title,
              message,
              type: type as any,
              date: "Just now",
            },
            ...state.notifications,
          ],
        }));
      },
      clearNotifications: () => set({ notifications: [] }),

      // Live Chat
      chatOpen: false,
      setChatOpen: (open) => set({ chatOpen: open }),
      chatMessages: [
        { id: "1", sender: "bot", text: "Hello! Welcome to HelpMate Luxury Support. How can I help you today?", timestamp: "10:00 AM" },
      ],
      sendChatMessage: (text, sender = "user") =>
        set((state) => {
          const now = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
          const userMsg: ChatMessage = { id: Math.random().toString(), sender, text, timestamp: now };

          let updatedMessages = [...state.chatMessages, userMsg];

          // Trigger simulated reply if user sent the message
          if (sender === "user") {
            setTimeout(() => {
              const replies = [
                "I understand your query. A dedicated customer support specialist is joining the chat to assist you.",
                "Let me look up your active booking. Could you verify your registered mobile number?",
                "Absolutely! All our professionals are 100% background checked and certified. Your safety is our absolute priority.",
                "For service customisation or large commercial tasks, you can schedule a free site inspection through our portal."
              ];
              const botReply: ChatMessage = {
                id: Math.random().toString(),
                sender: "bot",
                text: replies[Math.floor(Math.random() * replies.length)],
                timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
              };
              useStore.setState((s) => ({ chatMessages: [...s.chatMessages, botReply] }));
            }, 1000);
          }

          return { chatMessages: updatedMessages };
        }),
    }),
    {
      name: "helpmate-store",
      partialize: (state) => ({
        theme: state.theme,
        token: state.token,
        customerId: state.customerId,
        customerCode: state.customerCode,
        isLoggedIn: state.isLoggedIn,
        guestMode: state.guestMode,
        userPhone: state.userPhone,
        userName: state.userName,
        walletBalance: state.walletBalance,
        loyaltyPoints: state.loyaltyPoints,
        selectedLocation: state.selectedLocation,
        isLocationSet: state.isLocationSet,
        isOutOfServiceZone: state.isOutOfServiceZone,
        hasPromptedLocation: state.hasPromptedLocation,
        locationPermissionDenied: state.locationPermissionDenied,
        addresses: state.addresses,
        bookings: state.bookings,
        wishlist: state.wishlist,
        recentlyViewed: state.recentlyViewed,
        cart: state.cart,
        cartId: state.cartId,
        cartPricing: state.cartPricing,
        packageAddonsMap: state.packageAddonsMap,
        selectedDate: state.selectedDate,
        selectedTimeSlot: state.selectedTimeSlot,
        selectedAddressId: state.selectedAddressId,
        appliedCoupon: state.appliedCoupon,
        bookmarkedPackageIds: state.bookmarkedPackageIds,
        isMember: state.isMember,
        membershipTier: state.membershipTier,
      }),
    }
  )
);
