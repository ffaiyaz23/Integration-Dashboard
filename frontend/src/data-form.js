// data-form.js

import { useState } from 'react';
import {
    Box,
    Button,
    CircularProgress,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Paper,
    Typography,
} from '@mui/material';
import axios from 'axios';

const endpointMapping = {
    'Notion': 'notion',
    'Airtable': 'airtable',
    'HubSpot': 'hubspot',
};

export const DataForm = ({ integrationType, credentials }) => {
    const [loadedData, setLoadedData] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const [nextCursor, setNextCursor] = useState(null);
    const [hasMore, setHasMore] = useState(true);
    const endpoint = endpointMapping[integrationType];

    // Load Data Functionality
    const handleLoad = async () => {
        if (!credentials) {
            alert('No credentials found. Please connect to the integration first.');
            return;
        }

        if (!hasMore) {
            alert('No more data to load.');
            return;
        }

        try {
            setIsLoading(true);
            const formData = new FormData();
            formData.append('credentials', JSON.stringify(credentials));
            formData.append('limit', 100); // Adjust the limit as needed
            if (nextCursor) {
                formData.append('after', nextCursor);
            }

            const response = await axios.post(
                `http://localhost:8000/integrations/${endpoint}/get_hubspot_items`,
                formData
            );

            const { items, next_cursor } = response.data;

            setLoadedData(prev => [...prev, ...items]);
            setNextCursor(next_cursor);
            setHasMore(!!next_cursor);
        } catch (e) {
            alert(e?.response?.data?.detail || 'Error loading data');
        } finally {
            setIsLoading(false);
        }
    };

    // Clear Data Functionality
    const handleClear = () => {
        setLoadedData([]);
        setNextCursor(null);
        setHasMore(true);
    };

    return (
        <Box display="flex" flexDirection="column" alignItems="center" width="100%">
            {/* Load Data Button */}
            <Box display="flex" gap={2} sx={{ mt: 2 }}>
                <Button
                    onClick={handleLoad}
                    variant="contained"
                    disabled={isLoading || !hasMore}
                >
                    {isLoading ? <CircularProgress size={24} color="inherit" /> : 'Load Data'}
                </Button>
                <Button
                    onClick={handleClear}
                    variant="outlined"
                    disabled={loadedData.length === 0}
                >
                    Clear Data
                </Button>
            </Box>

            {/* Display Loaded Data */}
            {loadedData.length > 0 && (
                <Box sx={{ mt: 4, width: '100%' }}>
                    <TableContainer component={Paper}>
                        <Table>
                            <TableHead>
                                <TableRow>
                                    {Object.keys(loadedData[0] || {}).map((key) => (
                                        <TableCell key={key}>
                                            <Typography variant="subtitle1" fontWeight="bold">
                                                {key.replace(/_/g, ' ').toUpperCase()}
                                            </Typography>
                                        </TableCell>
                                    ))}
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {loadedData.map((item, idx) => (
                                    <TableRow key={idx}>
                                        {Object.values(item).map((value, i) => (
                                            <TableCell key={i}>{value}</TableCell>
                                        ))}
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </TableContainer>

                    {/* Load More Button */}
                    {hasMore && (
                        <Box display="flex" justifyContent="center" sx={{ mt: 2 }}>
                            <Button
                                onClick={handleLoad}
                                variant="contained"
                                disabled={isLoading}
                            >
                                {isLoading ? <CircularProgress size={24} color="inherit" /> : 'Load More'}
                            </Button>
                        </Box>
                    )}
                </Box>
            )}
        </Box>
    );
};
