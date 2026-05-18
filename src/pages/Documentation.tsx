import React, { useState, useEffect, useRef } from 'react';
import { Menu, X, ChevronDown, ChevronRight, FileText, Home, Book, Settings, HelpCircle } from 'lucide-react';

interface MenuItem {
    id: string;
    title: string;
    icon?: React.ReactNode;
    children?: MenuItem[];
    content?: string;
}

const documentationData: MenuItem[] = [
    {
        id: 'introduction',
        title: '1. Introduction',
        icon: <Home size={18} />,
        content: `
      <h1>Introduction</h1>
      <p>Welcome to Invelix, your comprehensive invoice management solution. Invelix helps businesses and entrepreneurs create professional invoices, manage products, track payments, and generate barcodes all in one place.</p>
      
      <h2>1.1 Key Features</h2>
      <ul>
        <li>Professional invoice creation with GST support</li>
        <li>Product inventory management with barcode generation</li>
        <li>Payment tracking (Paid, Partial, Unpaid status)</li>
        <li>Dashboard with sales and profit analytics</li>
        <li>QR code integration for digital payments</li>
        <li>Custom business branding (logo and signature)</li>
      </ul>
      
      <h2>1.2 System Requirements</h2>
      <ul>
        <li>Modern web browser (Chrome, Firefox, Safari, Edge)</li>
        <li>Internet connection</li>
        <li>Valid business email address</li>
      </ul>
    `
    },
    {
        id: 'getting-started',
        title: '2. Getting Started',
        icon: <Book size={18} />,
        children: [
            {
                id: 'creating-account',
                title: '2.1 Creating an Account',
                content: `
          <h2>2.1 Creating an Account</h2>
          <p>To begin using Invelix, you need to create a business account:</p>
          <ol>
            <li>Navigate to the Invelix registration page</li>
            <li>Enter your full name</li>
            <li>Provide a valid email address</li>
            <li>Enter a 10-digit mobile number</li>
            <li>Set a secure login password</li>
            <li>Click "Create account"</li>
          </ol>
        `
            },
            {
                id: 'signing-in',
                title: '2.2 Signing In',
                content: `
          <h2>2.2 Signing In</h2>
          <p>Once you have created an account:</p>
          <ol>
            <li>Visit the Invelix login page</li>
            <li>Enter your registered email address</li>
            <li>Enter your password</li>
            <li>Click "Let's Work!"</li>
          </ol>
          <div class="tip-box">
            <strong>Tip:</strong> If you forget your password, use the "Forgot password?" link to reset it.
          </div>
        `
            }
        ]
    },
    {
        id: 'business-settings',
        title: '3. Business Settings',
        icon: <Settings size={18} />,
        children: [
            {
                id: 'business-details',
                title: '3.1 Business Details',
                content: `
          <h2>3.1 Business Details</h2>
          <p>Enter your business information that will appear on all invoices:</p>
          <ul>
            <li><strong>Business name:</strong> Your company or business name</li>
            <li><strong>Address:</strong> Complete business address</li>
            <li><strong>City, State, Postal code:</strong> Location details</li>
            <li><strong>Phone:</strong> Contact number</li>
            <li><strong>Email:</strong> Business email</li>
            <li><strong>GST number:</strong> Your GST registration number</li>
            <li><strong>PAN number:</strong> Permanent Account Number</li>
          </ul>
        `
            },
            {
                id: 'bank-details',
                title: '3.2 Bank Details',
                content: `
          <h2>3.2 Bank Details</h2>
          <p>Configure your bank account information for payment collection:</p>
          <ul>
            <li><strong>Account holder name:</strong> Name as per bank records</li>
            <li><strong>Bank name:</strong> Your bank's name</li>
            <li><strong>Account number:</strong> Your bank account number</li>
            <li><strong>IFSC code:</strong> Bank branch IFSC code</li>
            <li><strong>Branch:</strong> Branch name or location</li>
          </ul>
          <p style="font-style: italic; margin-top: 16px;">Click "Save bank details" to update the information.</p>
        `
            },
            {
                id: 'logo-signature',
                title: '3.3 Logo & Signature',
                content: `
          <h2>3.3 Logo & Signature</h2>
          <p>Add professional branding to your invoices:</p>
          
          <h3>Logo</h3>
          <ul>
            <li>Upload a PNG/JPG image (max 2MB)</li>
            <li>Appears on the top-left of invoices</li>
            <li>Click "Replace logo" to change it</li>
          </ul>
          
          <h3>Signature</h3>
          <ul>
            <li>Upload a signature image or draw with mouse/touch</li>
            <li>Appears at the bottom-right of invoices</li>
            <li>Click "Upload new" or use the drawing canvas</li>
            <li>Click "Save signature" to confirm</li>
          </ul>
          
          <h3>QR Code</h3>
          <p>A QR code is automatically generated for your business and appears above the signature on invoices. Customers can scan this for quick payment or contact information.</p>
        `
            }
        ]
    },
    {
        id: 'product-management',
        title: '4. Product Management',
        icon: <FileText size={18} />,
        children: [
            {
                id: 'adding-product',
                title: '4.1 Adding a New Product',
                content: `
          <h2>4.1 Adding a New Product</h2>
          <ol>
            <li>Click "+ New product" button</li>
            <li>Enter the following details:
              <ul style="margin-left: 20px; margin-top: 8px;">
                <li><strong>Product name:</strong> Descriptive name (e.g., Boat Prime 313)</li>
                <li><strong>HSN code:</strong> Harmonized System of Nomenclature code</li>
                <li><strong>Stock quantity:</strong> Current inventory count</li>
                <li><strong>Barcode (optional):</strong> Enter or generate a barcode</li>
                <li><strong>Cost price (₹):</strong> Your purchase/manufacturing cost</li>
                <li><strong>Selling price (₹):</strong> Price you sell to customers</li>
                <li><strong>Margin %:</strong> Automatically calculated</li>
                <li><strong>GST rate:</strong> Select applicable GST percentage (0%, 5%, 12%, 18%, 28%)</li>
              </ul>
            </li>
            <li>Click "Save changes"</li>
          </ol>
        `
            },
            {
                id: 'viewing-products',
                title: '4.2 Viewing Product Information',
                content: `
          <h2>4.2 Viewing Product Information</h2>
          <p>The Products page displays:</p>
          <ul>
            <li><strong>Total Products:</strong> Number of products in inventory</li>
            <li><strong>Low Stock:</strong> Products with ≤5 units remaining</li>
            <li><strong>Inventory Value:</strong> Total cost-based stock value</li>
          </ul>
          <p style="font-style: italic; margin-top: 16px;">Each product row shows: name, HSN code, stock level, cost, price, margin %, and GST rate.</p>
        `
            },
            {
                id: 'editing-product',
                title: '4.3 Editing a Product',
                content: `
          <h2>4.3 Editing a Product</h2>
          <ol>
            <li>Click the edit icon (pencil) next to the product</li>
            <li>Modify the required fields</li>
            <li>Click "Save changes"</li>
          </ol>
        `
            },
            {
                id: 'product-stickers',
                title: '4.4 Generating Product Stickers',
                content: `
          <h2>4.4 Generating Product Stickers</h2>
          <p>Generate barcode stickers for your products:</p>
          <ol>
            <li>Click the barcode icon next to a product</li>
            <li>Choose sticker size (40 × 20 mm recommended)</li>
            <li>Set the quantity of stickers to generate</li>
            <li>View the preview with product name, MRP, and barcode</li>
            <li>Print or save the sticker sheet</li>
          </ol>
          <div class="tip-box">
            <strong>Note:</strong> Barcodes are automatically generated if not manually entered.
          </div>
        `
            }
        ]
    },
    {
        id: 'creating-invoices',
        title: '5. Creating Invoices',
        icon: <FileText size={18} />,
        children: [
            {
                id: 'customer-details',
                title: '5.1 Customer Details',
                content: `
          <h2>5.1 Customer Details</h2>
          <ul>
            <li><strong>Customer name:</strong> Enter customer's full name</li>
            <li><strong>Phone number:</strong> 10-digit mobile number with country code</li>
            <li><strong>Address:</strong> Street, City, State, PIN</li>
            <li><strong>GSTIN:</strong> Customer's GST number (optional)</li>
          </ul>
        `
            },
            {
                id: 'adding-items',
                title: '5.2 Adding Items',
                content: `
          <h2>5.2 Adding Items</h2>
          <p>You can add items in three ways:</p>
          
          <h3>Option 1: Select from Inventory</h3>
          <ol>
            <li>Click "Pick a product from inventory..."</li>
            <li>Select the product from the dropdown</li>
            <li>Product details auto-populate with price and GST</li>
          </ol>
          
          <h3>Option 2: Custom Line Item</h3>
          <ol>
            <li>Click "+ Custom line"</li>
            <li>Manually enter item name, quantity, price, and GST rate</li>
          </ol>
          
          <h3>Option 3: Scan Barcode</h3>
          <ol>
            <li>Click "Scan" button</li>
            <li>Use your device camera to scan product barcode</li>
            <li>Product automatically adds to the invoice</li>
          </ol>
        `
            },
            {
                id: 'gst-application',
                title: '5.3 GST Application',
                content: `
          <h2>5.3 GST Application</h2>
          <p>Toggle the "Apply GST on items" switch to add CGST 9% + SGST 9% to each item. The total automatically updates to reflect GST charges.</p>
        `
            },
            {
                id: 'adjustments',
                title: '5.4 Adjustments',
                content: `
          <h2>5.4 Adjustments</h2>
          <p>Apply discounts or record partial payments:</p>
          <ul>
            <li><strong>Discount (₹):</strong> Enter a fixed amount to reduce from subtotal</li>
            <li><strong>Paid now (₹):</strong> Amount received at the time of invoice creation</li>
          </ul>
        `
            },
            {
                id: 'invoice-summary',
                title: '5.5 Summary',
                content: `
          <h2>5.5 Summary</h2>
          <p>The summary panel displays:</p>
          <ul>
            <li><strong>Subtotal:</strong> Sum of all items before adjustments</li>
            <li><strong>Discount:</strong> Amount deducted</li>
            <li><strong>Final amount:</strong> Total after discount</li>
            <li><strong>Paid now:</strong> Amount received</li>
            <li><strong>Due amount:</strong> Outstanding balance</li>
          </ul>
        `
            },
            {
                id: 'saving-invoice',
                title: '5.6 Saving the Invoice',
                content: `
          <h2>5.6 Saving the Invoice</h2>
          <p>Click "Save invoice" to finalize. The invoice is assigned a unique number (e.g., INV-2026-0012) and can be viewed, downloaded, or shared as a PDF.</p>
        `
            }
        ]
    },
    {
        id: 'managing-invoices',
        title: '6. Managing Invoices',
        icon: <FileText size={18} />,
        children: [
            {
                id: 'invoice-overview',
                title: '6.1 Invoice Overview',
                content: `
          <h2>6.1 Invoice Overview</h2>
          <p>The invoice management page displays key metrics:</p>
          <ul>
            <li><strong>Filtered invoices:</strong> Total count of invoices</li>
            <li><strong>Total amount:</strong> Sum of all invoice values</li>
            <li><strong>Amount collected:</strong> Total payments received</li>
            <li><strong>Amount due:</strong> Outstanding balances</li>
          </ul>
        `
            },
            {
                id: 'filtering-invoices',
                title: '6.2 Filtering Invoices',
                content: `
          <h2>6.2 Filtering Invoices</h2>
          <p>Use the filters to find specific invoices:</p>
          <ul>
            <li><strong>Search bar:</strong> Search by invoice number, customer name, or phone</li>
            <li><strong>Date range:</strong> Filter by FROM and TO dates</li>
            <li><strong>Status:</strong> All, Paid, Partial, or Unpaid</li>
          </ul>
        `
            },
           {
  id: 'invoice-status',
  title: '6.3 Invoice Status',
  content: `
    <h2>6.3 Invoice Status</h2>
    <p>Invoices are automatically categorized:</p>
    
    <ul>
      <li><strong class="status-paid">Paid:</strong> Full payment received (due = ₹0)</li>
      <li><strong class="status-partial">Partial:</strong> Partial payment received (due > ₹0)</li>
      <li><strong class="status-unpaid">Unpaid:</strong> No payment received</li>
    </ul>

   <p class="mt-4 text-sm italic text-slate-400">
  Note: You can export invoices as a PDF or Excel file for further analysis.
</p>   
  `
},
            {
                id: 'viewing-invoice',
                title: '6.4 Viewing an Invoice',
                content: `
          <h2>6.4 Viewing an Invoice</h2>
          <ol>
            <li>Click the "View" icon next to an invoice</li>
            <li>View the complete invoice with:
              <ul style="margin-left: 20px; margin-top: 8px;">
                <li>Your business logo and details</li>
                <li>Customer information</li>
                <li>Itemized product list with HSN, GST, quantity, rate, and amount</li>
                <li>Total, CGST, SGST, discount breakdown</li>
                <li>Bank details for payment</li>
                <li>QR code and signature</li>
              </ul>
            </li>
            <li>Click "Save / PDF" to download</li>
          </ol>
        `
            },
            {
                id: 'deleting-invoice',
                title: '6.5 Deleting an Invoice',
                content: `
          <h2>6.5 Deleting an Invoice</h2>
          <p>To remove an invoice:</p>
          <ol>
            <li>Click the delete icon (trash) next to the invoice</li>
            <li>Confirm the deletion</li>
          </ol>
          <div class="warning-box">
            <strong>Warning:</strong> Deleted invoices cannot be recovered.
          </div>
        `
            }
        ]
    },
    {
        id: 'dashboard',
        title: '7. Dashboard Overview',
        icon: <Home size={18} />,
        children: [
            {
                id: 'key-metrics',
                title: '7.1 Key Metrics',
                content: `
          <h2>7.1 Key Metrics</h2>
          <p>Five key performance indicators are displayed at the top:</p>
          <ul>
            <li><strong>Total Sales:</strong> Sum of all invoice amounts</li>
            <li><strong>Total Profit:</strong> Net profit with margin percentage</li>
            <li><strong>Amount Due:</strong> Outstanding payments</li>
            <li><strong>Total Invoices:</strong> Number of invoices created</li>
            <li><strong>Inventory Value:</strong> Cost-based stock value</li>
          </ul>
        `
            },
            {
                id: 'collection-rate',
                title: '7.2 Collection Rate',
                content: `
          <h2>7.2 Collection Rate</h2>
          <p>A visual progress bar shows the percentage of invoiced amounts collected.</p>
        `
            },
            {
                id: 'sales-profit-chart',
                title: '7.3 Sales & Profit Chart',
                content: `
          <h2>7.3 Sales & Profit Chart</h2>
          <p>Track your business performance over time:</p>
          <ul>
            <li><strong>Time periods:</strong> Daily, Monthly, or Yearly view</li>
            <li><strong>Dual metrics:</strong> Sales (blue line) and Profit (green line) trends</li>
            <li><strong>Interactive:</strong> Hover over data points to see exact values</li>
            <li><strong>Bar chart:</strong> Monthly profit breakdown</li>
          </ul>
          <p style="font-style: italic; margin-top: 16px;">The chart shows historical data for the last 12 months, helping you identify trends and seasonal patterns.</p>
        `
            }
        ]
    },
    {
        id: 'troubleshooting',
        title: '8. Troubleshooting & Support',
        icon: <HelpCircle size={18} />,
        children: [
            {
                id: 'common-issues',
                title: '8.1 Common Issues',
                content: `
          <h2>8.1 Common Issues</h2>
          
          <h3>Problem: Cannot upload logo or signature</h3>
          <p><strong>Solution:</strong> Ensure the file is PNG or JPG format and under 2MB in size.</p>
          
          <h3>Problem: Products not appearing in invoice dropdown</h3>
          <p><strong>Solution:</strong> Add products in the Products section first before creating invoices.</p>
          
          <h3>Problem: GST calculation seems incorrect</h3>
          <p><strong>Solution:</strong> Ensure the "Apply GST on items" toggle is ON and GST rates are set correctly for each product.</p>
          
          <h3>Problem: Dashboard shows ₹0.00 for all metrics</h3>
          <p><strong>Solution:</strong> Create and save at least one invoice to populate dashboard data.</p>
        `
            },
            {
                id: 'best-practices',
                title: '8.2 Best Practices',
                content: `
          <h2>8.2 Best Practices</h2>
          <ul>
            <li>Complete business settings before creating invoices</li>
            <li>Add products with accurate cost and selling prices for profit tracking</li>
            <li>Update stock quantities regularly</li>
            <li>Download invoice PDFs for backup</li>
            <li>Review the dashboard weekly to monitor business health</li>
          </ul>
        `
            },
            {
                id: 'contact-support',
                title: '8.3 Contact Support',
                content: `
          <h2>8.3 Contact Support</h2>
          <p>If you encounter issues not covered in this manual:</p>
          <ul>
            <li><strong>Email:</strong> support@invelix.com</li>
            <li><strong>Help Center:</strong> Visit the Contact page in Invelix</li>
            <li><strong>Admin Support:</strong> Use "Admin? Sign in here" for administrative assistance</li>
          </ul>
        `
            }
        ]
    }
];

const DocumentationLayout: React.FC = () => {
    const [isSidebarOpen, setIsSidebarOpen] = useState(true);
    const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set(['getting-started']));
    const [activeContent, setActiveContent] = useState<string>(documentationData[0].id);
    const contentRefs = useRef<Map<string, HTMLDivElement>>(new Map());
    const scrollContainerRef = useRef<HTMLDivElement>(null);
    const isScrollingProgrammatically = useRef(false);

    // Collect all section IDs (including children)
    const getAllSectionIds = (): string[] => {
        const ids: string[] = [];
        documentationData.forEach(item => {
            if (item.content) ids.push(item.id);
            if (item.children) {
                item.children.forEach(child => {
                    if (child.content) ids.push(child.id);
                });
            }
        });
        return ids;
    };

    // Handle scroll to update active section
    useEffect(() => {
        const handleScroll = () => {
            if (isScrollingProgrammatically.current) return;

            const container = scrollContainerRef.current;
            if (!container) return;

            const allIds = getAllSectionIds();
            let currentSection = activeContent;

            // Find which section is currently in view
            for (const id of allIds) {
                const element = contentRefs.current.get(id);
                if (element) {
                    const rect = element.getBoundingClientRect();
                    // If section is in the top 30% of viewport
                    if (rect.top <= 200 && rect.bottom > 200) {
                        currentSection = id;
                        break;
                    }
                }
            }

            if (currentSection !== activeContent) {
                setActiveContent(currentSection);

                // Auto-expand parent if child is active
                documentationData.forEach(item => {
                    if (item.children) {
                        const hasActiveChild = item.children.some(child => child.id === currentSection);
                        if (hasActiveChild) {
                            setExpandedItems(prev => new Set(prev).add(item.id));
                        }
                    }
                });
            }
        };

        const container = scrollContainerRef.current;
        if (container) {
            container.addEventListener('scroll', handleScroll);
            return () => container.removeEventListener('scroll', handleScroll);
        }
    }, [activeContent]);

    const toggleExpand = (id: string) => {
        const newExpanded = new Set(expandedItems);
        if (newExpanded.has(id)) {
            newExpanded.delete(id);
        } else {
            newExpanded.add(id);
        }
        setExpandedItems(newExpanded);
    };

    const handleItemClick = (item: MenuItem) => {
        if (item.children) {
            toggleExpand(item.id);
        }
        if (item.content) {
            setActiveContent(item.id);

            // Scroll to the section
            const element = contentRefs.current.get(item.id);
            if (element) {
                isScrollingProgrammatically.current = true;
                element.scrollIntoView({ behavior: 'smooth', block: 'start' });

                // Reset flag after scroll animation
                setTimeout(() => {
                    isScrollingProgrammatically.current = false;
                }, 1000);
            }
        }
    };

    const findContent = (id: string): string => {
        for (const item of documentationData) {
            if (item.id === id && item.content) return item.content;
            if (item.children) {
                for (const child of item.children) {
                    if (child.id === id && child.content) return child.content;
                }
            }
        }
        return '<h1>Content not found</h1>';
    };

    const renderMenuItem = (item: MenuItem, level: number = 0) => {
        const isExpanded = expandedItems.has(item.id);
        const isActive = activeContent === item.id;
        const hasChildren = item.children && item.children.length > 0;

        return (
            <div key={item.id} style={{ marginLeft: level * 12 }}>
                <div
                    onClick={() => handleItemClick(item)}
                    style={{
                        display: 'flex',
                        alignItems: 'center',
                        padding: '10px 12px',
                        cursor: 'pointer',
                        backgroundColor: isActive ? '#1e293b' : 'transparent',
                        borderLeft: isActive ? '3px solid #6366F1' : '3px solid transparent',
                        color: isActive ? '#6366F1' : '#94a3b8',
                        fontWeight: isActive ? 600 : 400,
                        transition: 'all 0.2s',
                        borderRadius: '4px',
                        margin: '2px 0'
                    }}
                    onMouseEnter={(e) => {
                        if (!isActive) {
                            e.currentTarget.style.backgroundColor = '#1e293b';
                            e.currentTarget.style.color = '#cbd5e1';
                        }
                    }}
                    onMouseLeave={(e) => {
                        if (!isActive) {
                            e.currentTarget.style.backgroundColor = 'transparent';
                            e.currentTarget.style.color = '#94a3b8';
                        }
                    }}
                >
                    {hasChildren ? (
                        isExpanded ? <ChevronDown size={16} style={{ marginRight: 8, flexShrink: 0 }} /> : <ChevronRight size={16} style={{ marginRight: 8, flexShrink: 0 }} />
                    ) : (
                        <div style={{ width: 16, marginRight: 8, flexShrink: 0 }} />
                    )}
                    {item.icon && <span style={{ marginRight: 8, display: 'flex', flexShrink: 0 }}>{item.icon}</span>}
                    <span style={{ fontSize: '14px' }}>{item.title}</span>
                </div>
                {hasChildren && isExpanded && (
                    <div>
                        {item.children!.map(child => renderMenuItem(child, level + 1))}
                    </div>
                )}
            </div>
        );
    };

    const renderContent = () => {
        return documentationData.map(item => {
            if (item.content) {
                return (
                    <div
                        key={item.id}
                        ref={(el) => {
                            if (el) contentRefs.current.set(item.id, el);
                        }}
                        dangerouslySetInnerHTML={{ __html: item.content }}
                    />
                );
            }
            if (item.children) {
                return item.children.map(child => (
                    <div
                        key={child.id}
                        ref={(el) => {
                            if (el) contentRefs.current.set(child.id, el);
                        }}
                        dangerouslySetInnerHTML={{ __html: child.content || '' }}
                    />
                ));
            }
            return null;
        });
    };

    return (
        <div style={{ display: 'flex', height: '100vh', fontFamily: 'Inter, system-ui, sans-serif', backgroundColor: '#0f172a' }}>
            {/* Sidebar */}
            <div
                style={{
                    width: isSidebarOpen ? '320px' : '0',
                    backgroundColor: '#0f172a',
                    borderRight: '1px solid #1e293b',
                    overflow: 'auto',
                    transition: 'width 0.3s',
                    position: 'relative'
                }}
            >
                {isSidebarOpen && (
                    <div style={{ padding: '20px' }}>
                        <div style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            marginBottom: '24px',
                            paddingBottom: '16px',
                            borderBottom: '2px solid #1e293b'
                        }}>
                            <h2 style={{
                                margin: 0,
                                fontSize: '20px',
                                color: '#6366F1',
                                fontWeight: 700
                            }}>
                                INVELIX
                            </h2>
                            <button
                                onClick={() => setIsSidebarOpen(false)}
                                style={{
                                    background: 'none',
                                    border: 'none',
                                    cursor: 'pointer',
                                    padding: '4px',
                                    color: '#94a3b8'
                                }}
                            >
                                <X size={20} />
                            </button>
                        </div>
                        <div style={{ fontSize: '12px', color: '#64748b', marginBottom: '16px', fontWeight: 500 }}>
                            USER MANUAL v1.0
                        </div>
                        {documentationData.map(item => renderMenuItem(item))}
                    </div>
                )}
            </div>

            {/* Main Content */}
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
                {/* Header */}
                <div style={{
                    padding: '16px 24px',
                    backgroundColor: '#1e293b',
                    borderBottom: '1px solid #334155',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '16px'
                }}>
                    {!isSidebarOpen && (
                        <button
                            onClick={() => setIsSidebarOpen(true)}
                            style={{
                                background: 'none',
                                border: 'none',
                                cursor: 'pointer',
                                padding: '4px',
                                color: '#94a3b8'
                            }}
                        >
                            <Menu size={24} />
                        </button>
                    )}
                    <h1 style={{
                        margin: 0,
                        fontSize: '24px',
                        color: '#f1f5f9',
                        fontWeight: 600
                    }}>
                        Invelix User Manual
                    </h1>
                </div>

                {/* Content Area */}
                <div
                    ref={scrollContainerRef}
                    style={{
                        flex: 1,
                        overflow: 'auto',
                        padding: '32px 48px',
                        backgroundColor: '#0f172a'
                    }}
                >
                    <div
                        style={{
                            maxWidth: '900px',
                            margin: '0 auto',
                            lineHeight: '1.8',
                            color: '#cbd5e1'
                        }}
                    >
                        {renderContent()}

                        {/* Footer */}
                        <div style={{
                            textAlign: 'center',
                            marginTop: '80px',
                            paddingTop: '40px',
                            borderTop: '1px solid #1e293b'
                        }}>
                            <p style={{ fontSize: '18px', fontWeight: 600, color: '#6366F1', marginBottom: '8px' }}>
                                Thank you for choosing Invelix!
                            </p>
                            <p style={{ fontSize: '14px', fontStyle: 'italic', color: '#64748b', marginBottom: '8px' }}>
                                Track. Manage. Conquer.
                            </p>
                            <p style={{ fontSize: '12px', color: '#64748b' }}>
                                © 2026 Invelix. All rights reserved.
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Inline Styles for Content */}
            <style>{`
        h1 {
          color: #6366F1;
          font-size: 28px;
          margin-top: 32px;
          margin-bottom: 16px;
          font-weight: 700;
        }
        h2 {
          color: #818cf8;
          font-size: 22px;
          margin-top: 28px;
          margin-bottom: 12px;
          font-weight: 600;
        }
        h3 {
          color: #a5b4fc;
          font-size: 18px;
          margin-top: 20px;
          margin-bottom: 10px;
          font-weight: 600;
        }
        ul, ol {
          margin: 12px 0;
          padding-left: 24px;
        }
        li {
          margin: 8px 0;
          line-height: 1.6;
          color: #cbd5e1;
        }
        p {
          margin: 12px 0;
          line-height: 1.8;
          color: #cbd5e1;
        }
        strong {
          font-weight: 600;
          color: #f1f5f9;
        }
        .tip-box {
          background: #1e3a5f;
          padding: 12px;
          border-radius: 6px;
          margin-top: 16px;
          border-left: 4px solid #3b82f6;
          color: #bfdbfe;
        }
        .warning-box {
          background: #3f1f1f;
          padding: 12px;
          border-radius: 6px;
          margin-top: 16px;
          border-left: 4px solid #ef4444;
          color: #fecaca;
        }
        .status-paid {
          color: #10B981;
        }
        .status-partial {
          color: #F59E0B;
        }
        .status-unpaid {
          color: #EF4444;
        }
        
        /* Scrollbar Styling */
        ::-webkit-scrollbar {
          width: 8px;
          height: 8px;
        }
        ::-webkit-scrollbar-track {
          background: #1e293b;
        }
        ::-webkit-scrollbar-thumb {
          background: #334155;
          border-radius: 4px;
        }
        ::-webkit-scrollbar-thumb:hover {
          background: #475569;
        }
      `}</style>
        </div>
    );
};

export default DocumentationLayout;