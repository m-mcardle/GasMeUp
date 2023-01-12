// React
import React, { ComponentType, useState } from 'react';
import { View } from 'react-native';

import { DataTable } from 'react-native-paper';

// Components
import Text from './Text';

// Styles
import { globalStyles } from '../styles/styles';

interface Props {
  title: string,
  itemsPerPage?: number,
  data: Array<any>,
  loading?: boolean,
  Row: ComponentType,
  FooterRow?: ComponentType,
  headers: Array<Header>,
}

interface Header {
  text: string,
  numeric: boolean,
}

export default function Table({
  itemsPerPage = 10,
  data,
  Row,
  FooterRow = undefined,
  title,
  headers,
  loading = false,
}: Props) {
  const [page, setPage] = useState(0);

  const pageStart = page * itemsPerPage + 1;
  const pageEnd = (page + 1) * itemsPerPage;
  const numberOfPages = Number(((data.length) / itemsPerPage).toFixed(0));

  const pageData = data.length
    ? data.slice((pageStart - 1), (pageEnd))
    : [];

  const min = (a: number, b: number) => Math.min(a, b);

  return (
    <View>
      <Text style={globalStyles.title}>{title}</Text>
      <DataTable style={globalStyles.table}>

        <DataTable.Header>
          {
            headers.map((header) => (
              <DataTable.Title
                key={header.text}
                numeric={header.numeric}
              >
                {header.text}
              </DataTable.Title>
            ))
          }
        </DataTable.Header>

        {
          loading
            ? (
              <DataTable.Row>
                <DataTable.Cell>Loading...</DataTable.Cell>
              </DataTable.Row>
            )
            : pageData.map((rowData) => (
              // eslint-disable-next-line react/jsx-props-no-spreading
              <Row key={rowData.key} {...rowData} />
            ))
        }

        {FooterRow && <FooterRow />}

        <DataTable.Pagination
          page={page}
          numberOfPages={numberOfPages}
          onPageChange={setPage}
          label={`${min(pageStart, data.length)}-${min(pageEnd, data.length)} of ${data.length}`}
          selectPageDropdownLabel="Rows per page"
          numberOfItemsPerPage={itemsPerPage}
        />

      </DataTable>
    </View>
  );
}

Table.defaultProps = {
  itemsPerPage: 10,
  FooterRow: undefined,
  loading: false,
};