/*
 * Copyright 2023 Datastrato Pvt Ltd.
 * This software is licensed under the Apache License version 2.
 */

import { useEffect, useCallback, useState, Fragment } from 'react'

import Link from 'next/link'

import { Box, Grid, Card, IconButton, Typography, Portal, Tooltip } from '@mui/material'
import { DataGrid, GridToolbar } from '@mui/x-data-grid'

import Icon from '@/components/Icon'

import { useAppDispatch, useAppSelector } from '@/lib/hooks/useStore'
import { fetchMetalakes, setFilteredMetalakes, deleteMetalake, updateMetalake, resetTree } from '@/lib/store/metalakes'

import { formatToDateTime } from '@/lib/utils/date'
import TableHeader from './TableHeader'
import DetailsDrawer from '@/components/DetailsDrawer'
import CreateMetalakeDialog from './CreateMetalakeDialog'
import ConfirmDeleteDialog from '@/components/ConfirmDeleteDialog'

function TableToolbar(props) {
  return (
    <>
      <Fragment>
        <Portal container={() => document.getElementById('filter-panel')}>
          <Box className={`twc-w-full twc-justify-between twc-hidden`}>
            <GridToolbar {...props} />
          </Box>
        </Portal>
      </Fragment>
    </>
  )
}

const MetalakeList = () => {
  const dispatch = useAppDispatch()
  const store = useAppSelector(state => state.metalakes)

  const [value, setValue] = useState('')
  const [paginationModel, setPaginationModel] = useState({ page: 0, pageSize: 10 })
  const [openDrawer, setOpenDrawer] = useState(false)
  const [drawerData, setDrawerData] = useState()
  const [openDialog, setOpenDialog] = useState(false)
  const [dialogData, setDialogData] = useState({})
  const [dialogType, setDialogType] = useState('create')
  const [openConfirmDelete, setOpenConfirmDelete] = useState(false)
  const [confirmCacheData, setConfirmCacheData] = useState(null)

  const handleDeleteMetalake = name => {
    setOpenConfirmDelete(true)
    setConfirmCacheData(name)
  }

  const handleConfirmDeleteSubmit = () => {
    if (confirmCacheData) {
      dispatch(deleteMetalake(confirmCacheData))
      setOpenConfirmDelete(false)
    }
  }

  const handleCloseConfirm = () => {
    setOpenConfirmDelete(false)
    setConfirmCacheData(null)
  }

  const handleShowEditDialog = data => {
    setDialogType('update')
    setOpenDialog(true)
    setDialogData(data)
  }

  const handleFilter = useCallback(val => {
    setValue(val)
  }, [])

  const handleShowDetails = row => {
    setDrawerData(row)
    setOpenDrawer(true)
  }

  const handleClickLink = () => {
    dispatch(resetTree())
  }

  useEffect(() => {
    dispatch(fetchMetalakes())
  }, [dispatch])

  useEffect(() => {
    const filteredData = store.metalakes
      .filter(i => i.name.toLowerCase().includes(value.toLowerCase()))
      .sort((a, b) => {
        if (a.name.toLowerCase() === value.toLowerCase()) return -1
        if (b.name.toLowerCase() === value.toLowerCase()) return 1

        return 0
      })

    dispatch(setFilteredMetalakes(filteredData))
  }, [dispatch, store.metalakes, value])

  const columns = [
    {
      flex: 0.2,
      minWidth: 230,
      disableColumnMenu: true,
      filterable: true,
      field: 'name',
      headerName: 'Name',
      renderCell: ({ row }) => {
        const { name } = row

        return (
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <Tooltip title={name} placement='right'>
              <Typography
                noWrap
                component={Link}
                href={`/ui/metalakes?metalake=${name}`}
                onClick={() => handleClickLink()}
                sx={{
                  fontWeight: 500,
                  color: 'primary.main',
                  textDecoration: 'none',
                  maxWidth: 240,
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  '&:hover': { color: 'primary.main', textDecoration: 'underline' }
                }}
              >
                {name}
              </Typography>
            </Tooltip>
          </Box>
        )
      }
    },
    {
      flex: 0.15,
      minWidth: 150,
      disableColumnMenu: true,
      field: 'createdBy',
      headerName: 'Created by',
      renderCell: ({ row }) => {
        return (
          <Typography noWrap sx={{ color: 'text.secondary' }}>
            {row.audit?.creator}
          </Typography>
        )
      }
    },
    {
      flex: 0.15,
      minWidth: 150,
      disableColumnMenu: true,
      valueGetter: params => `${params.row.audit?.createTime}`,
      field: 'createdAt',
      headerName: 'Created at',
      renderCell: ({ row }) => {
        return (
          <Typography noWrap sx={{ color: 'text.secondary' }}>
            {formatToDateTime(row.audit?.createTime)}
          </Typography>
        )
      }
    },
    {
      flex: 0.1,
      minWidth: 90,
      sortable: false,
      disableColumnMenu: true,
      field: 'actions',
      headerName: 'Actions',
      renderCell: ({ row }) => (
        <>
          <IconButton
            title='Details'
            size='small'
            sx={{ color: theme => theme.palette.text.secondary }}
            onClick={() => handleShowDetails(row)}
          >
            <Icon icon='bx:show-alt' />
          </IconButton>

          <IconButton
            title='Edit'
            size='small'
            sx={{ color: theme => theme.palette.text.secondary }}
            onClick={() => handleShowEditDialog(row)}
          >
            <Icon icon='mdi:square-edit-outline' />
          </IconButton>

          <IconButton
            title='Delete'
            size='small'
            sx={{ color: theme => theme.palette.error.light }}
            onClick={() => handleDeleteMetalake(row.name)}
          >
            <Icon icon='mdi:delete-outline' />
          </IconButton>
        </>
      )
    }
  ]

  return (
    <Grid container spacing={6}>
      <Grid item xs={12}>
        <Card>
          <TableHeader
            value={value}
            handleFilter={handleFilter}
            setOpenDialog={setOpenDialog}
            setDialogData={setDialogData}
            setDialogType={setDialogType}
          />
          <DataGrid
            disableColumnSelector
            disableDensitySelector
            slots={{ toolbar: TableToolbar }}
            slotProps={{
              toolbar: {
                printOptions: { disableToolbarButton: true },
                csvOptions: { disableToolbarButton: true }
              }
            }}
            sx={{
              '& .MuiDataGrid-virtualScroller': {
                minHeight: 36
              },
              maxHeight: 'calc(100vh - 23.2rem)'
            }}
            getRowId={row => row?.name}
            rows={store.filteredMetalakes}
            columns={columns}
            disableRowSelectionOnClick
            pageSizeOptions={[10, 25, 50]}
            paginationModel={paginationModel}
            onPaginationModelChange={setPaginationModel}
          />
          <DetailsDrawer openDrawer={openDrawer} setOpenDrawer={setOpenDrawer} drawerData={drawerData} />
        </Card>
      </Grid>
      <CreateMetalakeDialog
        open={openDialog}
        setOpen={setOpenDialog}
        updateMetalake={updateMetalake}
        data={dialogData}
        type={dialogType}
      />
      <ConfirmDeleteDialog
        open={openConfirmDelete}
        setOpen={setOpenConfirmDelete}
        confirmCacheData={confirmCacheData}
        handleClose={handleCloseConfirm}
        handleConfirmDeleteSubmit={handleConfirmDeleteSubmit}
      />
    </Grid>
  )
}

export default MetalakeList
