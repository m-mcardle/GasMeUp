// React
import React, { ComponentType, useEffect, useState } from 'react';
import { ScrollView, View } from 'react-native';

import { ActivityIndicator, DataTable } from 'react-native-paper';

// Components
import Text from './Text';

// Styles
import { globalStyles, colors } from '../styles/styles';

interface Props {
  title?: string,
  itemsPerPage?: number,
  data: Array<any>,
  loading?: boolean,
  scrollable?: boolean,
  Row: ComponentType,
  FooterRow?: ComponentType,
  EmptyState?: ComponentType,
  headers: Array<Header>,
  style?: object,
}

interface Header {
  text: string,
  numeric: boolean,
  style?: object,
}

export default function Table({
  itemsPerPage = 10,
  data,
  Row,
  FooterRow = undefined,
  EmptyState,
  title,
  headers,
  loading = false,
  scrollable = false,
  style,
}: Props) {
  const [page, setPage] = useState(0);

  const pageStart = page * itemsPerPage + 1;
  const pageEnd = scrollable ? data.length : (page + 1) * itemsPerPage;
  const numberOfPages = scrollable ? 1 : Math.ceil(data.length / itemsPerPage);

  const pageData = data.length
    ? data.slice((pageStart - 1), (pageEnd))
    : [];

  const min = (a: number, b: number) => Math.min(a, b);

  // Reset page number when data changes
  useEffect(() => {
    setPage(0);
  }, [data]);

  return (
    <View style={style}>
      {title && <Text style={globalStyles.title}>{title}</Text>}
      <DataTable style={globalStyles.table}>

        <DataTable.Header>
          {
            headers.map((header) => (
              <DataTable.Title
                key={header.text}
                numeric={header.numeric}
                textStyle={{ color: colors.secondary }}
                style={header.style}
              >
                {header.text}
              </DataTable.Title>
            ))
          }
        </DataTable.Header>

        {scrollable ? (
          <ScrollView style={{ maxHeight: '100%' }}>
            {
            loading
              ? (
                <DataTable.Row style={{ minHeight: 250, alignContent: 'center' }}>
                  <DataTable.Cell style={{ alignContent: 'center', justifyContent: 'center' }}>
                    <ActivityIndicator animating color={colors.action} size="large" />
                  </DataTable.Cell>
                </DataTable.Row>
              )
              : pageData.map((rowData) => {
                const { key, ...rowDataWithoutKey } = rowData;
                // eslint-disable-next-line react/jsx-props-no-spreading
                return <Row key={rowData.key} {...rowDataWithoutKey} />;
              })
          }
          </ScrollView>
        )
          : (
            <View>
              {
            loading
              ? (
                <DataTable.Row style={{ minHeight: 250, alignContent: 'center' }}>
                  <DataTable.Cell style={{ alignContent: 'center', justifyContent: 'center' }}>
                    <ActivityIndicator animating color={colors.action} size="large" />
                  </DataTable.Cell>
                </DataTable.Row>
              )
              : pageData.map((rowData) => (
                // eslint-disable-next-line react/jsx-props-no-spreading
                <Row key={rowData.key} {...rowData} />
              ))
          }
            </View>
          )}

        {!pageData.length && !loading && (
        <DataTable.Row style={{ minHeight: 250, alignContent: 'center' }}>
          <DataTable.Cell style={{ alignContent: 'center', justifyContent: 'center' }}>
            {EmptyState
              ? <EmptyState />
              : <Text style={{ color: colors.secondary }}>No Data</Text>}
          </DataTable.Cell>
        </DataTable.Row>
        )}

        {FooterRow && <FooterRow />}

        {!scrollable && (
        <DataTable.Pagination
          page={page}
          numberOfPages={numberOfPages}
          onPageChange={setPage}
          label={`${min(pageStart, data.length)}-${min(pageEnd, data.length)} of ${data.length}`}
          selectPageDropdownLabel="Rows per page"
          numberOfItemsPerPage={itemsPerPage}
        />
        )}

      </DataTable>
    </View>
  );
}
